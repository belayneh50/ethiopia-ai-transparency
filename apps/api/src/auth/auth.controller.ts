import { Body, Controller, Get, Param, Post, Query, Request, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard, RolesGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@ethiopia-ai/shared-types';

class LoginDto {
  email!: string;
  password!: string;
}

// New self-registered accounts are always created with the backend's
// least-privilege role. No role is accepted from the client; a role field in
// the body is stripped by the whitelist below, never trusted.
class RegisterDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  email!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72) // bcrypt silently truncates beyond 72 bytes
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(await this.authService.validateUser(dto.email, dto.password));
  }

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async register(@Body() dto: RegisterDto) {
    return this.authService.createUser(dto);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  async findAllUsers(@Query() query: any) {
    const { page = 1, limit = 10 } = query;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
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
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  async findOne(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
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