import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from './schemas/users.schema';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const adminExists = await this.userModel.findOne({ role: UserRole.admin });
    if (adminExists) return;

    const email =
      this.configService.get<string>('ADMIN_EMAIL') ?? 'admin@example.com';
    const password =
      this.configService.get<string>('ADMIN_PASSWORD') ?? 'changeme';
    const passwordHash = await bcrypt.hash(password, 10);

    await this.userModel.create({
      name: 'Admin',
      email,
      passwordHash,
      role: UserRole.admin,
      isActive: true,
    });

    this.logger.log(`Default admin created: ${email}`);
  }
}
