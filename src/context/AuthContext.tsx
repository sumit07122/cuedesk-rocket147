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

export const DEFAULT_REVIEW_USER: UserProfile = {
  id: 'owner-preview-user',
  uid: 'owner-preview-user',
  email: 'owner@oneshotsnooker.com',
  displayName: 'Club Owner',
  fullName: 'One Shot Club Owner',
  phone: '+91 98765 43210',
  photoURL: '',
  role: 'owner',
  clubId: DEFAULT_CLUB_ID,
  status: 'active',
  createdAt: 1700000000000,
  lastLoginAt: Date.now(),
  lastLogin: Date.now()
};

const IS_REVIEW_MODE = import.meta.env.DEV && (import.meta.env.VITE_REVIEW_MODE !== 'false');

export const getInitialReviewUser = (): UserProfile | null => {
  if (!IS_REVIEW_MODE) return null;
  try {
    const isLoggedOut = localStorage.getItem('cuedesk_logged_out');
    if (isLoggedOut === 'true') {
      return null;
    }
    const saved = localStorage.getItem('cuedesk_review_user');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return DEFAULT_REVIEW_USER;
};

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
      return `Domain '${currentDomain}' is not authorized in Firebase Console. Please add '${currentDomain}' under Firebase Console -> Authentication -> Settings -> Authorized Domains.`;
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is disabled in Firebase Console. Please enable Email/Password provider.';
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
  const [user, setUser] = useState<UserProfile | null>(getInitialReviewUser);
  const [isLoading, setIsLoading] = useState<boolean>(!IS_REVIEW_MODE);
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
          setUser(IS_REVIEW_MODE ? getInitialReviewUser() : null);
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

  // Email & Password Login (Instant Review Mode)
  const signInWithEmail = async (emailStr: string, pass: string) => {
    setIsLoading(true);
    const cleanEmail = emailStr.trim().toLowerCase();

    if (!cleanEmail || !pass.trim()) {
      setIsLoading(false);
      throw new Error('Enter both your email and password.');
    }

    if (!IS_REVIEW_MODE) {
      try {
        const credential = await signInWithEmailAndPassword(auth, cleanEmail, pass.trim());
        if (!credential.user.emailVerified) throw new Error('Verify your email address before signing in.');
        const snap = await getDoc(doc(db, 'users', credential.user.uid));
        let profile: UserProfile;
        if (!snap.exists()) {
          profile = await loadOrCreateCustomerProfile(credential.user);
        } else {
          profile = snap.data() as UserProfile;
          if (profile.status !== 'active' || !['owner', 'manager', 'worker', 'customer'].includes(profile.role) || (profile.role === 'customer' && !profile.customerId)) {
            throw new Error('This account is inactive or has an invalid role. Contact the club owner.');
          }
        }
        const signedInProfile = { ...profile, id: credential.user.uid, uid: credential.user.uid };
        setUser(signedInProfile);
        setCurrentClubId(profile.clubId || DEFAULT_CLUB_ID);
        localStorage.setItem('cuedesk_club_id', profile.clubId || DEFAULT_CLUB_ID);
      } catch (err) {
        await fbSignOut(auth).catch(() => {});
        setUser(null);
        setIsLoading(false);
        throw err;
      }
      setIsLoading(false);
      return;
    }

    const roleMap: Record<string, UserRole> = {
      'owner@oneshotsnooker.com': 'owner',
      'manager@oneshotsnooker.com': 'manager',
      'owner@cuedesk.com': 'owner',
      'admin@cuedesk.com': 'owner',
    };

    const matchedRole: UserRole = roleMap[cleanEmail] || (cleanEmail.includes('owner') || cleanEmail.includes('admin') ? 'owner' : 'manager');

    const roleLabels: Record<UserRole, string> = {
      owner: 'Club Owner',
      manager: 'Club Manager',
      worker: 'Club Manager',
      customer: 'Club Customer'
    };

    const reviewUser: UserProfile = {
      ...DEFAULT_REVIEW_USER,
      id: `user-${matchedRole}`,
      uid: `user-${matchedRole}`,
      email: cleanEmail,
      displayName: roleLabels[matchedRole] || cleanEmail.split('@')[0],
      fullName: `One Shot ${roleLabels[matchedRole] || matchedRole.toUpperCase()}`,
      role: matchedRole,
      clubId: DEFAULT_CLUB_ID,
      status: 'active',
      lastLoginAt: Date.now(),
      lastLogin: Date.now()
    };

    const customPassMap = JSON.parse(localStorage.getItem('cuedesk_user_passwords') || '{}');
    if (customPassMap[cleanEmail] && customPassMap[cleanEmail] !== pass.trim()) {
      setIsLoading(false);
      throw new Error('Incorrect password. Please verify your credentials or ask the admin for assistance.');
    }

    setUser(reviewUser);
    try {
      localStorage.removeItem('cuedesk_logged_out');
      localStorage.setItem('cuedesk_review_role', matchedRole);
      localStorage.setItem('cuedesk_review_user', JSON.stringify(reviewUser));
    } catch {}

    setIsLoading(false);
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
    if (IS_REVIEW_MODE) {
      try {
        const existing = JSON.parse(localStorage.getItem('cuedesk_user_passwords') || '{}');
        existing[clean] = newPass.trim();
        localStorage.setItem('cuedesk_user_passwords', JSON.stringify(existing));
      } catch {}
      return;
    }

    // If Firebase Auth currentUser matches, update Firebase password directly
    if (auth.currentUser && auth.currentUser.email?.toLowerCase() === clean) {
      await updatePassword(auth.currentUser, newPass.trim());
      return;
    }
    throw new Error('A staff account password can only be changed by that signed-in user.');
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
