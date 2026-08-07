import React, { useEffect } from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, PageView } from '../../types';
import { Capability, hasCapability, canAccessPage, recordPermissionDenied } from '../../utils/permissions';
import { Button } from '../ui/Button';

interface RoleGuardProps {
  requiredRole?: UserRole;
  requiredCapability?: Capability;
  requiredPage?: PageView;
  fallback?: React.ReactNode;
  onNavigateHome?: () => void;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  requiredRole,
  requiredCapability,
  requiredPage,
  fallback,
  onNavigateHome,
  children
}) => {
  const { user, role, hasPermission, currentClubId } = useAuth();

  let isAllowed = true;
  let reason = '';

  if (requiredRole && !hasPermission(requiredRole)) {
    isAllowed = false;
    reason = `Requires minimum role level: ${requiredRole.toUpperCase()}`;
  } else if (requiredCapability && !hasCapability(role, requiredCapability)) {
    isAllowed = false;
    reason = `Your role (${role.toUpperCase()}) does not possess capability '${requiredCapability}'`;
  } else if (requiredPage && !canAccessPage(role, requiredPage)) {
    isAllowed = false;
    reason = `Your role (${role.toUpperCase()}) does not have access to the ${requiredPage} section.`;
  }

  useEffect(() => {
    if (!isAllowed && user) {
      recordPermissionDenied(
        currentClubId,
        user.email,
        role,
        requiredPage || requiredCapability || requiredRole || 'unauthorized_action'
      );
    }
  }, [isAllowed, user, role, currentClubId, requiredPage, requiredCapability, requiredRole]);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-8 max-w-lg mx-auto my-12 bg-white rounded-3xl border border-red-200/80 shadow-sm flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-xs mb-3">
        <ShieldAlert className="w-7 h-7" />
      </div>
      <h2 className="text-lg font-extrabold text-neutral-900 tracking-tight">Permission Denied</h2>
      <p className="text-xs text-neutral-600 mt-1 mb-4 leading-relaxed max-w-sm">
        {reason}
      </p>
      <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-[11px] text-neutral-500 w-full mb-5 font-mono">
        Current User: <span className="font-bold text-neutral-800">{user?.displayName || user?.email}</span> ({role.toUpperCase()})
      </div>
      {onNavigateHome && (
        <Button
          variant="primary"
          onClick={onNavigateHome}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="bg-neutral-900 text-white hover:bg-neutral-800"
        >
          Return to Dashboard
        </Button>
      )}
    </div>
  );
};
