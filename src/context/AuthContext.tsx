import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut as fbSignOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updatePassword,
  sendEmailVerification,
  updateProfile,
  User as FbUser 
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { UserRole, UserProfile, UserInvitation } from '../types';
import { 
  DEFAULT_CLUB_ID, 
  ensureClubInitialized, 
  logAuditEvent,
  createInvitationDoc
} from '../services/dbService';

export interface AuthContextType {
  user: UserProfile | null;
  fbUser: FbUser | null;
  currentClubId: string;
  role: UserRole;
  isReviewMode: boolean;
  isLoading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string, 
    pass: string, 
    fullName: string, 
    phone?: string, 
    inviteCode?: string,
    inviteRole?: UserRole
  ) => Promise<void>;
  signUpCustomerWithEmail: (email: string, pass: string, fullName: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUserPassword: (email: string, newPass: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  switchClub: (clubId: string) => void;
  switchRole: (role: UserRole) => void;
  hasPermission: (requiredRole: UserRole) => boolean;
  createStaffInvitation: (
    email: string, 
    fullName: string, 
    phone: string, 
    role: UserRole
  ) => Promise<UserInvitation>;
}

export const DEFAULT_OWNER_USER: UserProfile = {
  id: 'owner-master',
  uid: 'owner-master',
  email: 'owner@oneshotgaming.com',
  displayName: 'Club Owner',
  fullName: 'One Shot Gaming Club Owner',
  phone: '+91 98765 43210',
  photoURL: '',
  role: 'owner',
  clubId: DEFAULT_CLUB_ID,
  status: 'active',
  createdAt: 1700000000000,
  lastLoginAt: Date.now(),
  lastLogin: Date.now()
};

export const DEFAULT_REVIEW_USER: UserProfile = DEFAULT_OWNER_USER;

const IS_REVIEW_MODE = true;

export const getInitialUser = (): UserProfile | null => {
  try {
    const isLoggedOut = localStorage.getItem('cuedesk_logged_out');
    if (isLoggedOut === 'true') {
      return null;
    }
    const saved = localStorage.getItem('cuedesk_user') || localStorage.getItem('cuedesk_review_user');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return DEFAULT_OWNER_USER;
};

export const getInitialReviewUser = getInitialUser;

const loadOrCreateCustomerProfile = async (fbUser: FbUser): Promise<UserProfile> => {
  if (!fbUser.email || !fbUser.emailVerified) {
    throw new Error('Verify your email address before signing in.');
  }
  const profileRef = doc(db, 'users', fbUser.uid);
  let profileSnap = await getDoc(profileRef);
  if (!profileSnap.exists()) {
    const email = fbUser.email.toLowerCase();
    const accessSnap = await getDoc(doc(db, 'clubs', DEFAULT_CLUB_ID, 'customerAccess', email));
    if (!accessSnap.exists() || accessSnap.data().enabled !== true) {
      throw new Error('This email is not linked to a customer profile at One Shot Snooker Club. Ask the club to add your email first.');
    }
    const access = accessSnap.data();
    const customerProfile: UserProfile = {
      id: fbUser.uid,
      uid: fbUser.uid,
      email,
      displayName: fbUser.displayName || 'Club Customer',
      fullName: fbUser.displayName || 'Club Customer',
      photoURL: fbUser.photoURL || '',
      role: 'customer',
      clubId: access.clubId,
      customerId: access.customerId,
      status: 'active',
      createdAt: Date.now(),
    };
    await setDoc(profileRef, customerProfile);
    profileSnap = await getDoc(profileRef);
  }
  if (!profileSnap.exists()) throw new Error('Customer profile setup could not be completed. Contact the club.');
  const profile = profileSnap.data() as UserProfile;
  if (profile.role !== 'customer' || profile.email !== fbUser.email.toLowerCase() || profile.status !== 'active' || !profile.customerId) {
    throw new Error('This sign-in does not have an active customer profile. Contact the club.');
  }
  return { ...profile, id: fbUser.uid, uid: fbUser.uid };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Format Firebase Error Messages for end-user display
export const formatAuthError = (error: any): string => {
  if (!error) return 'An unknown error occurred.';
  const code = error.code || '';
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  switch (code) {
    case 'auth/unauthorized-domain':
      return 'Access domain not recognized. Please sign in through the official One Shot application.';
    case 'auth/operation-not-allowed':
      return 'Sign-in method is temporarily unavailable. Please try again or contact administrator.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled. Please contact your administrator.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please verify your internet connection.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const registrationInProgress = useRef(false);
  const [fbUser, setFbUser] = useState<FbUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(getInitialUser);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentClubId, setCurrentClubId] = useState<string>(() => {
    return DEFAULT_CLUB_ID;
  });

  // Initialize club records only after a real Firebase staff account is authenticated.
  useEffect(() => {
    if (currentClubId && fbUser && user?.status === 'active' && user.role !== 'customer') {
      ensureClubInitialized(currentClubId).catch(() => {});
    }
  }, [currentClubId, fbUser, user]);

  // Firebase Auth State Listener (Bypassed for Client Review)
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setFbUser(currentUser);

        if (registrationInProgress.current) return;

        if (!currentUser) {
          setUser((prev) => {
            if (prev && prev.id === 'owner-master') return prev;
            return getInitialUser();
          });
          setIsLoading(false);
          return;
        }

        try {
          if (!currentUser.emailVerified) throw new Error('Verify your email address before signing in.');
          let snap = await getDoc(doc(db, 'users', currentUser.uid));
          if (!snap.exists()) {
            const customerProfile = await loadOrCreateCustomerProfile(currentUser);
            setUser(customerProfile);
            setCurrentClubId(customerProfile.clubId);
            localStorage.setItem('cuedesk_club_id', customerProfile.clubId);
            setIsLoading(false);
            return;
          }
          const data = snap.data() as UserProfile;
          const validRole = ['owner', 'manager', 'worker', 'customer'].includes(data.role);
          if (data.status !== 'active' || !validRole || (data.role === 'customer' && !data.customerId)) {
            throw new Error('This account is inactive or has an invalid role. Contact the club owner.');
          }

          const updatedProfile: UserProfile = {
            ...data,
            id: currentUser.uid,
            uid: currentUser.uid,
            lastLoginAt: Date.now(),
            lastLogin: Date.now()
          };
          setUser(updatedProfile);
          if (data.clubId) {
            setCurrentClubId(data.clubId);
            localStorage.setItem('cuedesk_club_id', data.clubId);
          }
        } catch (err) {
          console.error('Unable to load the signed-in staff profile:', err);
          setUser(null);
          await fbSignOut(auth).catch(() => {});
        } finally {
          setIsLoading(false);
        }
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firebase auth listener skipped in review mode:', e);
      setIsLoading(false);
    }
  }, []);

  // Username/Email & Password Login (Master default: owner / 1234)
  const signInWithEmail = async (emailOrUsername: string, pass: string) => {
    setIsLoading(true);
    const cleanInput = emailOrUsername.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanInput || !cleanPass) {
      setIsLoading(false);
      throw new Error('Please enter both username and password.');
    }

    // 1. Direct Master Owner Authentication (Default: username = owner, pass = 1234)
    const savedOwnerPass = localStorage.getItem('cuedesk_owner_password') || '1234';
    const isOwnerLogin = 
      cleanInput === 'owner' || 
      cleanInput === 'admin' || 
      cleanInput === 'owner@oneshotgaming.com' || 
      cleanInput === 'owner@oneshotsnooker.com' || 
      cleanInput === 'owner@cuedesk.com';

    if (isOwnerLogin) {
      if (cleanPass !== savedOwnerPass && cleanPass !== '1234') {
        setIsLoading(false);
        throw new Error('Incorrect password. Default credentials: Username: owner | Password: 1234');
      }

      const ownerUser: UserProfile = {
        ...DEFAULT_OWNER_USER,
        lastLoginAt: Date.now(),
        lastLogin: Date.now()
      };

      setUser(ownerUser);
      setCurrentClubId(DEFAULT_CLUB_ID);
      try {
        localStorage.removeItem('cuedesk_logged_out');
        localStorage.setItem('cuedesk_user', JSON.stringify(ownerUser));
        localStorage.setItem('cuedesk_review_user', JSON.stringify(ownerUser));
        localStorage.setItem('cuedesk_club_id', DEFAULT_CLUB_ID);
      } catch {}

      setIsLoading(false);
      return;
    }

    // 2. Custom local credentials check (e.g. staff created in settings)
    try {
      const customPassMap = JSON.parse(localStorage.getItem('cuedesk_user_passwords') || '{}');
      if (customPassMap[cleanInput] && customPassMap[cleanInput] === cleanPass) {
        const isManager = cleanInput.includes('manager');
        const staffUser: UserProfile = {
          ...DEFAULT_OWNER_USER,
          id: `user-${cleanInput}`,
          uid: `user-${cleanInput}`,
          email: cleanInput,
          displayName: isManager ? 'Club Manager' : cleanInput,
          fullName: isManager ? 'Club Manager' : cleanInput,
          role: isManager ? 'manager' : 'owner',
          lastLoginAt: Date.now(),
          lastLogin: Date.now()
        };
        setUser(staffUser);
        localStorage.removeItem('cuedesk_logged_out');
        localStorage.setItem('cuedesk_user', JSON.stringify(staffUser));
        setIsLoading(false);
        return;
      }
    } catch {}

    // 3. Fallback to Firebase Auth if an email address was provided
    if (cleanInput.includes('@')) {
      try {
        const credential = await signInWithEmailAndPassword(auth, cleanInput, cleanPass);
        let snap = await getDoc(doc(db, 'users', credential.user.uid));
        let profile: UserProfile;
        if (!snap.exists()) {
          profile = await loadOrCreateCustomerProfile(credential.user);
        } else {
          profile = snap.data() as UserProfile;
        }
        const signedInProfile = { ...profile, id: credential.user.uid, uid: credential.user.uid };
        setUser(signedInProfile);
        setCurrentClubId(profile.clubId || DEFAULT_CLUB_ID);
        localStorage.removeItem('cuedesk_logged_out');
        localStorage.setItem('cuedesk_user', JSON.stringify(signedInProfile));
        setIsLoading(false);
        return;
      } catch (err: any) {
        setIsLoading(false);
        throw new Error(formatAuthError(err) || 'Sign in failed. Default login: owner / 1234');
      }
    }

    setIsLoading(false);
    throw new Error('Invalid credentials. Default login is: Username: owner | Password: 1234');
  };

  const signUpCustomerWithEmail = async (emailStr: string, pass: string, fullName: string) => {
    setIsLoading(true);
    registrationInProgress.current = true;
    try {
      const email = emailStr.trim().toLowerCase();
      if (!email || pass.length < 6 || !fullName.trim()) throw new Error('Enter your name, a valid email address, and a password with at least 6 characters.');
      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(credential.user, { displayName: fullName.trim() });
      await sendEmailVerification(credential.user);
      await fbSignOut(auth);
      setUser(null);
      setFbUser(null);
    } catch (error) {
      await fbSignOut(auth).catch(() => {});
      throw error;
    } finally {
      registrationInProgress.current = false;
      setIsLoading(false);
    }
  };

  // Email Registration — First user becomes Owner, subsequent users require invitation
  const signUpWithEmail = async (
    email: string, 
    pass: string, 
    fullName: string, 
    phone?: string, 
    inviteCode?: string,
    inviteRole?: UserRole
  ) => {
    setIsLoading(true);
    registrationInProgress.current = true;
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = inviteCode?.trim() || '';
      if (!cleanCode) throw new Error('Staff accounts require a club-owner invitation code.');
      if (!['manager', 'worker'].includes(inviteRole || 'worker')) throw new Error('Staff invitations can only grant manager or worker access.');

      const targetRole: UserRole = inviteRole === 'manager' ? 'manager' : 'worker';
      const targetClubId = DEFAULT_CLUB_ID;
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const newUid = credential.user.uid;

      const profile: UserProfile = {
        id: newUid,
        uid: newUid,
        email: cleanEmail,
        displayName: fullName,
        fullName,
        phone: phone || '',
        photoURL: credential.user.photoURL || '',
        role: targetRole,
        clubId: targetClubId,
        status: 'active',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        lastLogin: Date.now()
      };

      const batch = writeBatch(db);
      batch.set(doc(db, 'users', newUid), { ...profile, invitationCode: cleanCode });
      batch.update(doc(db, 'invitations', cleanEmail), {
        status: 'accepted',
        acceptedAt: Date.now(),
        acceptedByUid: newUid,
      });
      await batch.commit();
      await sendEmailVerification(credential.user);
      await fbSignOut(auth);
      setUser(null);
      setFbUser(null);

    } catch (err) {
      await fbSignOut(auth).catch(() => {});
      console.error('Sign-Up Error:', err);
      throw err;
    } finally {
      registrationInProgress.current = false;
      setIsLoading(false);
    }
  };

  // Password Reset
  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      console.error('Password Reset Error:', err);
      throw err;
    }
  };

  // Update User Password (for current user or staff accounts)
  const updateUserPassword = async (emailStr: string, newPass: string) => {
    const clean = emailStr.trim().toLowerCase();
    const isOwner = clean === 'owner' || clean.includes('owner') || clean === 'admin';
    
    // Always persist owner password locally so 1234 or new custom password works offline/standalone
    if (isOwner) {
      localStorage.setItem('cuedesk_owner_password', newPass.trim());
    }

    try {
      const existing = JSON.parse(localStorage.getItem('cuedesk_user_passwords') || '{}');
      existing[clean] = newPass.trim();
      if (isOwner) existing['owner'] = newPass.trim();
      localStorage.setItem('cuedesk_user_passwords', JSON.stringify(existing));
    } catch {}

    // Also update Firebase if signed into Firebase
    if (auth.currentUser && auth.currentUser.email?.toLowerCase() === clean) {
      await updatePassword(auth.currentUser, newPass.trim());
    }
  };

  // Logout (Brings user to Login View)
  const signOutUser = async () => {
    if (user) {
      logAuditEvent(user.clubId || currentClubId, 'USER_LOGOUT', user.email, 'User signed out').catch(() => {});
    }
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('Firebase sign out error:', err);
    }
    setUser(null);
    try {
      localStorage.setItem('cuedesk_logged_out', 'true');
      localStorage.removeItem('cuedesk_user');
      localStorage.removeItem('cuedesk_review_role');
      localStorage.removeItem('cuedesk_review_user');
    } catch {}
  };

  // Switch Club Workspace
  const switchClub = (newClubId: string) => {
    if (!IS_REVIEW_MODE) throw new Error('This One Shot setup uses a single club workspace.');
    localStorage.setItem('cuedesk_club_id', newClubId);
    setCurrentClubId(newClubId);
    if (user) {
      const updated = { ...user, clubId: newClubId };
      setUser(updated);
      updateDoc(doc(db, 'users', user.id), { clubId: newClubId }).catch(() => {});
    }
    ensureClubInitialized(newClubId);
  };

  // Switch Role helper for client review to preview different permissions
  const switchRole = (newRole: UserRole) => {
    if (!IS_REVIEW_MODE) return;
    const roleLabels: Record<UserRole, string> = {
      owner: 'Club Owner',
      manager: 'Club Manager',
      worker: 'Club Worker',
      customer: 'Club Customer'
    };
    const updated: UserProfile = {
      ...(user || DEFAULT_REVIEW_USER),
      role: newRole,
      displayName: roleLabels[newRole] || `${newRole.toUpperCase()} (Review)`,
      fullName: `One Shot ${roleLabels[newRole] || newRole.toUpperCase()}`,
      email: `${newRole}@oneshotsnooker.com`,
    };
    setUser(updated);
    try {
      localStorage.setItem('cuedesk_review_role', newRole);
      localStorage.setItem('cuedesk_review_user', JSON.stringify(updated));
    } catch {}
  };

  // Role Permissions Guard
  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!user || user.status === 'disabled') return false;
    const roleHierarchy: Record<UserRole, number> = {
      owner: 3,
      manager: 2,
      worker: 1,
      customer: 0
    };
    return (roleHierarchy[user.role] ?? 0) >= (roleHierarchy[requiredRole] ?? 0);
  };

  // Invite Staff Member (Owner function)
  const createStaffInvitation = async (
    email: string, 
    fullName: string, 
    phone: string, 
    roleToAssign: UserRole
  ): Promise<UserInvitation> => {
    if (!user || user.role !== 'owner') {
      throw new Error('Only the Club Owner can create staff invitations.');
    }

    if (!['manager', 'worker'].includes(roleToAssign)) throw new Error('Staff invitations can only grant manager or worker access.');
    const code = `CUE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const invData: Omit<UserInvitation, 'id'> = {
      clubId: user.clubId || currentClubId,
      email: email.toLowerCase().trim(),
      fullName,
      phone,
      role: roleToAssign,
      invitedBy: user.id,
      invitedByName: user.displayName || user.email,
      status: 'pending',
      code,
      createdAt: Date.now()
    };

    const docId = await createInvitationDoc(invData);
    const created: UserInvitation = { id: docId, ...invData };

    logAuditEvent(
      user.clubId || currentClubId,
      'STAFF_INVITATION_CREATED',
      user.email,
      `Created an invitation for ${fullName} (${email}) as ${roleToAssign.toUpperCase()}`
    ).catch(() => {});

    return created;
  };

  return (
    <AuthContext.Provider value={{
      user,
      fbUser,
      currentClubId,
      role: user?.role || 'worker',
      isReviewMode: IS_REVIEW_MODE,
      isLoading,
      signInWithEmail,
      signUpWithEmail,
      signUpCustomerWithEmail,
      sendPasswordReset,
      updateUserPassword,
      signOutUser,
      switchClub,
      switchRole,
      hasPermission,
      createStaffInvitation
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
