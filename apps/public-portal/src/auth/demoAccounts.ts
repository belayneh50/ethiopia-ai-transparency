// Thin portal adapter over the shared demo accounts (packages/shared-types).
// usernames/passwords/roles live in exactly one place; uiRole is derived with
// the same mapper the portal uses for real logins, so no second mapping exists.
import { DEMO_ACCOUNTS as SHARED_DEMO_ACCOUNTS, type UserRole } from '@ethiopia-ai/shared-types';
import { mapUserRoleToRole, type Role } from './roles';

export type DemoAccount = (typeof SHARED_DEMO_ACCOUNTS)[number] & {
  // Backend UserRole as the login panel labels it (governor / public / ...).
  backendUserRole: UserRole;
  // UI role derived through mapUserRoleToRole — the single role mapping here.
  uiRole: Role;
};

export const DEMO_ACCOUNTS: DemoAccount[] = SHARED_DEMO_ACCOUNTS.map((account) => ({
  ...account,
  backendUserRole: account.role,
  uiRole: mapUserRoleToRole(account.role),
}));
