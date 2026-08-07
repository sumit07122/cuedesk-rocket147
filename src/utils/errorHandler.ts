/**
 * CueDesk Error Handling & Security Error Logger
 * Strictly conforms to Firebase Skill Specification for FirestoreErrorInfo
 */

import { auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Handles Firestore errors by formatting them into a structured JSON string log
 * and rethrowing a clean exception.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || false,
      isAnonymous: currentUser?.isAnonymous || false,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Converts any raw error (technical exception or FirestoreErrorInfo JSON)
 * into a safe, user-friendly message without leaking credentials or stack traces.
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  let rawMsg = error instanceof Error ? error.message : String(error);

  // Check if error is a stringified FirestoreErrorInfo
  try {
    const parsed = JSON.parse(rawMsg);
    if (parsed && typeof parsed === 'object' && 'error' in parsed) {
      rawMsg = parsed.error;
    }
  } catch {
    // Not JSON, use raw string
  }

  const lower = rawMsg.toLowerCase();

  if (lower.includes('permission-denied') || lower.includes('insufficient permissions')) {
    return 'Access Denied: You do not have permission to perform this action.';
  }
  if (lower.includes('unauthenticated') || lower.includes('auth/user-not-found')) {
    return 'Authentication required. Please sign in again.';
  }
  if (lower.includes('quota exceeded') || lower.includes('resource-exhausted')) {
    return 'System busy due to high usage. Please try again in a few moments.';
  }
  if (lower.includes('not-found') || lower.includes('document missing')) {
    return 'The requested record or table was not found.';
  }
  if (lower.includes('already-exists')) {
    return 'A record with this identifier already exists.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network-request-failed') || lower.includes('offline')) {
    return 'Network connection lost. Check your internet connection and try again.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many requests. Please slow down and wait a minute.';
  }

  // Fallback safe message
  return rawMsg.length > 100 ? 'Operation failed. Please verify your inputs and try again.' : rawMsg;
}
