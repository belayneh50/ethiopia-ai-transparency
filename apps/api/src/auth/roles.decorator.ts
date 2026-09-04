import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@ethiopia-ai/shared-types';

export const ROLES_KEY = 'roles';

// Factory: returns a NestJS SetMetadata decorator. Works as class decorator,
// method decorator, and parameter decorator because SetMetadata handles all.
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);