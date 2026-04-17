import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { User } from './schemas/users.schema';
import { UserRole } from '../../common/enums/user-role.enum';

const mockSave = jest.fn();

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  _id: 'user-id',
  name: 'Alice',
  email: 'alice@example.com',
  passwordHash: 'hashed',
  role: UserRole.agent,
  isActive: true,
  save: mockSave,
  ...overrides,
});

const mockUserModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
};

function MockModel(
  this: Record<string, unknown>,
  dto: Record<string, unknown>,
) {
  Object.assign(this, dto);
  this.save = mockSave;
}

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue(makeUser());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: Object.assign(MockModel, mockUserModel),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('creates user with hashed password', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      const result = await service.create({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'secret123',
        role: UserRole.agent,
      });
      expect(mockSave).toHaveBeenCalled();
      expect(result.passwordHash).toBeDefined();
    });

    it('does not store plain text password', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      const plainPassword = 'secret123';
      mockSave.mockResolvedValueOnce(
        makeUser({ passwordHash: await bcrypt.hash(plainPassword, 10) }),
      );
      const result = await service.create({
        name: 'Alice',
        email: 'alice@example.com',
        password: plainPassword,
        role: UserRole.agent,
      });
      expect(result.passwordHash).not.toBe(plainPassword);
      const isMatch = await bcrypt.compare(plainPassword, result.passwordHash);
      expect(isMatch).toBe(true);
    });

    it('throws ConflictException if email already exists', async () => {
      mockUserModel.findOne.mockResolvedValue(makeUser());
      await expect(
        service.create({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret123',
          role: UserRole.agent,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('soft deletes user by setting isActive to false', async () => {
      const user = makeUser();
      mockUserModel.findById.mockReturnValue({
        exec: () => Promise.resolve(user),
      });
      mockUserModel.countDocuments.mockResolvedValue(2);
      await service.remove('user-id');
      expect(user.isActive).toBe(false);
      expect(mockSave).toHaveBeenCalled();
    });

    it('throws BadRequestException when deleting the last admin', async () => {
      const admin = makeUser({ role: UserRole.admin });
      mockUserModel.findById.mockReturnValue({
        exec: () => Promise.resolve(admin),
      });
      mockUserModel.countDocuments.mockResolvedValue(1);
      await expect(service.remove('user-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('throws NotFoundException if user does not exist on update', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: () => Promise.resolve(null),
      });
      await expect(
        service.update('nonexistent-id', { name: 'Bob' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
