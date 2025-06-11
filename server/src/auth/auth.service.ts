import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from 'src/users/user.service';
import { UserDocument } from 'src/users/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user: UserDocument | null =
      await this.userService.findUserByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user.toObject(); // Use 'toObject()' method here
      return { ...result };
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      id: user.id,
      firstName: user.firstName,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: payload,
    };
  }
}
