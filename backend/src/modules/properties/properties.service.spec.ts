import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesService } from './properties.service';
import { Property } from './schemas/properties.schema';
import { UsersService } from '../users/users.service';
import { PropertyType } from '../../common/enums/property-type.enum';
import { PropertyStatus } from '../../common/enums/property-status.enum';

const mockSave = jest.fn();

const makeProperty = (overrides: Record<string, unknown> = {}) => ({
  _id: 'prop-id',
  title: 'Test Property',
  address: '123 Main St',
  type: PropertyType.apartment,
  price: 100000,
  listingAgentId: 'agent-id',
  status: PropertyStatus.available,
  save: mockSave,
  ...overrides,
});

const mockPropertyModel = {
  findById: jest.fn(),
  find: jest.fn(),
  findByIdAndDelete: jest.fn(),
};

function MockModel(
  this: Record<string, unknown>,
  dto: Record<string, unknown>,
) {
  Object.assign(this, dto);
  this.save = mockSave;
}

const mockUsersService = {
  findOne: jest.fn(),
};

describe('PropertiesService', () => {
  let service: PropertiesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue(makeProperty());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        {
          provide: getModelToken(Property.name),
          useValue: Object.assign(MockModel, mockPropertyModel),
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
  });

  describe('create', () => {
    it('creates property successfully', async () => {
      mockUsersService.findOne.mockResolvedValue({ _id: 'agent-id' });
      const result = await service.create({
        title: 'Test Property',
        address: '123 Main St',
        type: PropertyType.apartment,
        price: 100000,
        listingAgentId: 'agent-id',
      });
      expect(mockUsersService.findOne).toHaveBeenCalledWith('agent-id');
      expect(mockSave).toHaveBeenCalled();
      expect(result.title).toBe('Test Property');
    });

    it('throws NotFoundException if listingAgentId does not exist', async () => {
      mockUsersService.findOne.mockRejectedValue(
        new NotFoundException('User not found'),
      );
      await expect(
        service.create({
          title: 'Test Property',
          address: '123 Main St',
          type: PropertyType.apartment,
          price: 100000,
          listingAgentId: 'nonexistent-id',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('throws NotFoundException if property does not exist on update', async () => {
      mockPropertyModel.findById.mockReturnValue({
        exec: () => Promise.resolve(null),
      });
      await expect(
        service.update('nonexistent-id', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
