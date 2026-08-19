import { Controller, Post, Body, UseGuards, Request, Get, Query, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { UserRole } from '@ethiopia-ai/shared-types';

class LoginDto {
  email!: string;
  password!: string;
}

class CreateUserDto {
  email!: string;
  name!: string;
  password!: string;
  role?: UserRole;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(await this.authService.validateUser(dto.email, dto.password));
  }

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.authService.createUser(dto);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.admin)
  async findAllUsers(@Query() query: any) {
    const { page = 1, limit = 10 } = query;
    const [users, total] = await Promise.all([
      this.authService['prisma'].user.findMany({
        skip: (page - 1) * limit,
        take: Number(limit),
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      this.authService['prisma'].user.count(),
    ]);

    return {
      data: users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.admin)
  async findOne(@Param('id') id: string) {
    const user = await this.authService['prisma'].user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return { data: null };
    }

    return { data: user };
  }
}