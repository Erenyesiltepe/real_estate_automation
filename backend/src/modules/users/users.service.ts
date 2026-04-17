import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/users.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const exists = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });
    if (exists) {
      throw new ConflictException('Email already in use');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const created = new this.userModel({ ...dto, passwordHash });
    return created.save();
  }

  findAll(): Promise<UserDocument[]> {
    return this.userModel.find({ isActive: true }).exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase(), isActive: true })
      .exec();
    if (!user) {
      throw new NotFoundException(`User ${email} not found`);
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    const dtoRecord = dto as Record<string, unknown>;
    if (dtoRecord['password']) {
      dtoRecord['passwordHash'] = await bcrypt.hash(
        dtoRecord['password'] as string,
        10,
      );
      delete dtoRecord['password'];
    }
    Object.assign(user, dto);
    return user.save();
  }

  async remove(id: string): Promise<void> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    if (user.role === UserRole.admin) {
      const activeAdminCount = await this.userModel.countDocuments({
        role: UserRole.admin,
        isActive: true,
      });
      if (activeAdminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin');
      }
    }
    user.isActive = false;
    await user.save();
  }
}
