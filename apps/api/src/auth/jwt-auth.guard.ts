import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { UserRole } from '@ethiopia-ai/shared-types';

// Validates the Bearer token via the Passport "jwt" strategy (see JwtStrategy)
// and attaches the authenticated user to request.user.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// Enforces @Roles(...) metadata declared on a handler or controller class.
// Must be applied after JwtAuthGuard so that request.user is populated.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions for this role');
    }

    return true;
  }
}
