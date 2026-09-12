import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut as fbSignOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  User as FbUser 
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import { UserRole, UserProfile, UserInvitation } from '../types';
import { 
  DEFAULT_CLUB_ID, 
  ensureClubInitialized, 
  logAuditEvent,
  findInvitationByEmail,
  findInvitationByCode,
  markInvitationAcceptedDoc,
  createInvitationDoc
} from '../services/dbService';

export interface AuthContextType {
  user: UserProfile | null;
  fbUser: FbUser | null;
  currentClubId: string;
  role: UserRole;
  isLoading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string, 
    pass: string, 
    fullName: string, 
    phone?: string, 
    inviteCode?: string
  ) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
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

export const getInitialReviewUser = (): UserProfile => {
  try {
    const saved = localStorage.getItem('cuedesk_review_user');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return DEFAULT_REVIEW_USER;
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
  const [fbUser, setFbUser] = useState<FbUser | null>(null);
  const [user, setUser] = useState<UserProfile>(getInitialReviewUser);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentClubId, setCurrentClubId] = useState<string>(() => {
    return localStorage.getItem('cuedesk_club_id') || DEFAULT_CLUB_ID;
  });

  // Keep club initialized
  useEffect(() => {
    if (currentClubId) {
      ensureClubInitialized(currentClubId).catch(() => {});
    }
  }, [currentClubId]);

  // Firebase Auth State Listener (Bypassed for Client Review)
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setFbUser(currentUser);

        if (currentUser) {
          try {
            // Sync user profile from Firestore if available
            const userDocRef = doc(db, 'users', currentUser.uid);
            const snap = await getDoc(userDocRef);

            if (snap.exists()) {
              const data = snap.data() as UserProfile;
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
            }
          } catch (err) {
            console.warn('Firebase user sync note (review mode active):', err);
          }
        }
        // In review mode: never set user to null! Always keep client logged in.
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firebase auth listener skipped in review mode:', e);
      setIsLoading(false);
    }
  }, [currentClubId]);

  // Email & Password Login (Instant Review Mode)
  const signInWithEmail = async (emailStr: string, pass: string) => {
    setIsLoading(true);
    const cleanEmail = emailStr.trim().toLowerCase();

    const roleMap: Record<string, UserRole> = {
      'owner@oneshotsnooker.com': 'owner',
      'manager@oneshotsnooker.com': 'manager',
      'cashier@oneshotsnooker.com': 'cashier',
      'kitchen@oneshotsnooker.com': 'kitchen',
    };

    let matchedRole: UserRole = roleMap[cleanEmail] || 'owner';
    if (cleanEmail.includes('manager')) matchedRole = 'manager';
    else if (cleanEmail.includes('cashier')) matchedRole = 'cashier';
    else if (cleanEmail.includes('kitchen')) matchedRole = 'kitchen';

    const roleLabels: Record<UserRole, string> = {
      owner: 'Club Owner',
      manager: 'General Manager',
      cashier: 'Front Desk Cashier',
      kitchen: 'Kitchen / KDS Operator'
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

    setUser(reviewUser);
    try {
      localStorage.setItem('cuedesk_review_role', matchedRole);
      localStorage.setItem('cuedesk_review_user', JSON.stringify(reviewUser));
    } catch {}

    // Optional background Firebase auth attempt (errors safely ignored for review)
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, pass.trim());
    } catch {}

    setIsLoading(false);
  };

  // Email Registration — First user becomes Owner, subsequent users require invitation
  const signUpWithEmail = async (
    email: string, 
    pass: string, 
    fullName: string, 
    phone?: string, 
    inviteCode?: string
  ) => {
    setIsLoading(true);
    try {
      // Check if any users exist in Firestore
      const usersSnap = await getDocs(query(collection(db, 'users'), limit(1)));
      const isFirstUser = usersSnap.empty;

      let targetRole: UserRole = 'owner';
      let targetClubId = currentClubId || DEFAULT_CLUB_ID;

      if (!isFirstUser) {
        // Subsequent users MUST have an invitation
        let foundInv = null;
        if (inviteCode && inviteCode.trim()) {
          foundInv = await findInvitationByCode(inviteCode.trim());
        }
        if (!foundInv && email) {
          foundInv = await findInvitationByEmail(email.trim());
        }

        if (foundInv) {
          targetRole = foundInv.role;
          targetClubId = foundInv.clubId;
          await markInvitationAcceptedDoc(foundInv.id);
        } else {
          throw new Error('Public registration is closed. Please ask the Club Owner for an invitation code to register.');
        }
      }

      const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const newUid = credential.user.uid;

      const profile: UserProfile = {
        id: newUid,
        uid: newUid,
        email: email.trim(),
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

      await setDoc(doc(db, 'users', newUid), profile);
      setUser(profile);
      setCurrentClubId(targetClubId);
      localStorage.setItem('cuedesk_club_id', targetClubId);

    } catch (err) {
      console.error('Sign-Up Error:', err);
      throw err;
    } finally {
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

  // Logout (In Review Mode: Resets to Club Owner)
  const signOutUser = async () => {
    if (user) {
      logAuditEvent(user.clubId || currentClubId, 'USER_LOGOUT', user.email, 'User reset session').catch(() => {});
    }
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('Firebase sign out error:', err);
    }
    setUser(DEFAULT_REVIEW_USER);
    try {
      localStorage.setItem('cuedesk_review_role', 'owner');
      localStorage.setItem('cuedesk_review_user', JSON.stringify(DEFAULT_REVIEW_USER));
    } catch {}
  };

  // Switch Club Workspace
  const switchClub = (newClubId: string) => {
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
    const roleLabels: Record<UserRole, string> = {
      owner: 'Club Owner',
      manager: 'General Manager',
      cashier: 'Front Desk Cashier',
      kitchen: 'Kitchen / KDS Operator'
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
      cashier: 1,
      kitchen: 1
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

    const code = `CUE-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
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
      `Invited ${fullName} (${email}) as ${roleToAssign.toUpperCase()} with code ${code}`
    ).catch(() => {});

    return created;
  };

  return (
    <AuthContext.Provider value={{
      user,
      fbUser,
      currentClubId,
      role: user?.role || 'owner',
      isLoading,
      signInWithEmail,
      signUpWithEmail,
      sendPasswordReset,
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
