import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

const mockUser = {
  _id: 'user-id',
  email: 'test@example.com',
  passwordHash: '$2a$10$hashedpassword',
  role: 'admin',
};

const mockUsersService = {
  findByEmail: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('signed-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns an access token on valid credentials', async () => {
    mockUser.passwordHash = await bcrypt.hash('password123', 10);
    mockUsersService.findByEmail.mockResolvedValue(mockUser);

    const result = await service.signIn('test@example.com', 'password123');

    expect(result).toEqual({ access_token: 'signed-token' });
    expect(mockJwtService.signAsync).toHaveBeenCalledWith({
      sub: mockUser._id,
      email: mockUser.email,
      role: mockUser.role,
    });
  });

  it('throws UnauthorizedException if user not found', async () => {
    mockUsersService.findByEmail.mockRejectedValue(new NotFoundException('not found'));

    await expect(service.signIn('noone@example.com', 'password123')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException if password is wrong', async () => {
    mockUser.passwordHash = await bcrypt.hash('correctpassword', 10);
    mockUsersService.findByEmail.mockResolvedValue(mockUser);

    await expect(service.signIn('test@example.com', 'wrongpassword')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
