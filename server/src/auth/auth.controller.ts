import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { UserService } from 'src/users/user.service';
import { JwtAuthGuard } from './auth.guard';
import { CreateUserInput } from 'src/users/input/create-user-input';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('register')
  async register(@Body() body: CreateUserInput) {
    return this.userService.createUser(body);
  }

  @Post('login')
  async login(@Body() body) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new BadRequestException('Invalid login credential');
    }
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  getProfile(@Request() req) {
    // console.log(req);
    return req.user;
  }
}
