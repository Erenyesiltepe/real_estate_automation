import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, password: string) {
    let user: Awaited<ReturnType<typeof this.usersService.findByEmail>>;
    try {
      user = await this.usersService.findByEmail(email);
    } catch {
      throw new UnauthorizedException();
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException();

    const payload = { sub: user._id, email: user.email, role: user.role };
    return { access_token: await this.jwtService.signAsync(payload) };
  }
}
