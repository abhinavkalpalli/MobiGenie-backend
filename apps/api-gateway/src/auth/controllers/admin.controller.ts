import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly authService: AuthService) {}

  @Get('users')
  @HttpCode(HttpStatus.OK)
  async getUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const result = await this.authService.adminGetUsers(page, limit);
    return { message: 'Users retrieved successfully', data: result };
  }

  @Put('users/:id/role')
  @HttpCode(HttpStatus.OK)
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: string,
    @Req() req: Request & { user: { userId: string } },
  ) {
    const result = await this.authService.adminUpdateRole(id, role, req.user.userId);
    return { message: 'User role updated successfully', data: result };
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    const result = await this.authService.adminDeleteUser(id);
    return { message: 'User deleted successfully', data: result };
  }
}
