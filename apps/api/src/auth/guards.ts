import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ROLES_KEY, Roles } from './roles.decorator';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@ethiopia-ai/shared-types';

export class JwtAuthGuard extends AuthGuard('jwt') {
  private reflector: Reflector;

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) {
      return super.canActivate(context) as boolean;
    }

    return super.canActivate(context) as boolean;
  }
}