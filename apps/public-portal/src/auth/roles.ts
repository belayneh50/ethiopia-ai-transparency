// Role-based permission model for the LOCAL DEMONSTRATION only.
// This is NOT production authentication. All checks here run in the browser
// and can be bypassed by anyone with DevTools. They enforce a role-appropriate
// UI and block accidental unauthorized local mutations.

export type Role = 'admin' | 'recorder' | 'reviewer' | 'readonly';

export type Capability =
  | 'viewRecords'
  | 'addEditRecord'
  | 'accessMarketComparisons'
  | 'addVerifyComparable'
  | 'performHumanReview'
  | 'requestGemini'
  | 'changeThresholds'
  | 'importSession'
  | 'resetDemoData'
  | 'exportRecords'
  | 'exportPublicReport'
  | 'writeInternalNote'
  | 'writePublicSummary'
  | 'viewInternalNotes'
  | 'manageDemoAccounts';

export const ROLE_LABELS: Record<Role, { en: string; am: string }> = {
  admin: { en: 'Admin', am: 'አስተዳዳሪ' },
  recorder: { en: 'Recorder', am: 'መዝገቢያ' },
  reviewer: { en: 'Reviewer', am: 'እርምጃ ሰራሽ' },
  readonly: { en: 'Read-only Viewer', am: 'ንባብ ብቻ' },
};

export const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  admin: [
    'viewRecords',
    'addEditRecord',
    'accessMarketComparisons',
    'addVerifyComparable',
    'performHumanReview',
    'requestGemini',
    'changeThresholds',
    'importSession',
    'resetDemoData',
    'exportRecords',
    'exportPublicReport',
    'writeInternalNote',
    'writePublicSummary',
    'viewInternalNotes',
    'manageDemoAccounts',
  ],
  recorder: [
    'viewRecords',
    'addEditRecord',
    'exportRecords',
    'exportPublicReport',
    'writePublicSummary',
  ],
  reviewer: [
    'viewRecords',
    'accessMarketComparisons',
    'addVerifyComparable',
    'performHumanReview',
    'requestGemini',
    'exportRecords',
    'exportPublicReport',
    'writeInternalNote',
    'writePublicSummary',
    'viewInternalNotes',
  ],
  readonly: ['viewRecords', 'accessMarketComparisons', 'exportPublicReport'],
};

export function can(role: Role | null, action: Capability): boolean {
  if (!role) return false;
  const caps = ROLE_CAPABILITIES[role];
  if (!caps) return false;
  return caps.includes(action);
}

// Map backend UserRole ("public" | "reviewer" | "governor" | "admin")
// to frontend Role ("admin" | "recorder" | "reviewer" | "readonly").
// governor is the closest backend role to data-entry (recorder).
// public is read-only.
export function mapUserRoleToRole(userRole: string): Role {
  switch (userRole) {
    case 'admin':
      return 'admin';
    case 'reviewer':
      return 'reviewer';
    case 'governor':
      return 'recorder';
    case 'public':
      return 'readonly';
    default:
      return 'readonly';
  }
}
