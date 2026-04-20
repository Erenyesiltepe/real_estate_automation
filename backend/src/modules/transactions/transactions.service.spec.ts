import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { Transaction } from './schemas/transactions.schema';
import { TransactionStage } from '../../common/enums/transaction-stage.enum';
import { UsersService } from '../users/users.service';
import { PropertiesService } from '../properties/properties.service';
import { CommissionsService } from '../commissions/commissions.service';

const mockSave = jest.fn();
const mockFindById = jest.fn();
const mockFind = jest.fn();

const mockTransactionModel = { findById: mockFindById, find: mockFind };

function MockModel(
  this: Record<string, unknown>,
  dto: Record<string, unknown>,
) {
  Object.assign(this, dto);
  this.save = mockSave;
}

const mockUsersService = { findOne: jest.fn() };
const mockPropertiesService = { findOne: jest.fn() };
const mockCommissionsService = { createForTransaction: jest.fn() };

const makeTransaction = (overrides: Record<string, unknown> = {}) => ({
  _id: 'txn-id',
  propertyId: 'prop-id',
  listingAgentId: { toString: () => 'agent-1' },
  sellingAgentId: { toString: () => 'agent-2' },
  salePrice: 500000,
  totalServiceFee: 25000,
  stage: TransactionStage.agreement,
  stageUpdatedAt: new Date(),
  save: mockSave,
  ...overrides,
});

describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockUsersService.findOne.mockResolvedValue({ role: 'agent' });
    mockPropertiesService.findOne.mockResolvedValue({});
    mockCommissionsService.createForTransaction.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getModelToken(Transaction.name),
          useValue: Object.assign(MockModel, mockTransactionModel),
        },
        { provide: UsersService, useValue: mockUsersService },
        { provide: PropertiesService, useValue: mockPropertiesService },
        { provide: CommissionsService, useValue: mockCommissionsService },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  describe('create', () => {
    it('initial stage is always set to agreement on create', async () => {
      mockSave.mockResolvedValue(makeTransaction());
      const result = await service.create({
        propertyId: 'prop-id',
        listingAgentId: 'agent-1',
        sellingAgentId: 'agent-2',
        salePrice: 500000,
        totalServiceFee: 25000,
      });
      expect(result.stage).toBe(TransactionStage.agreement);
    });

    it('throws BadRequestException if listing agent is an admin', async () => {
      mockUsersService.findOne
        .mockResolvedValueOnce({ role: 'admin' })
        .mockResolvedValueOnce({ role: 'agent' });
      await expect(
        service.create({
          propertyId: 'prop-id',
          listingAgentId: 'admin-1',
          sellingAgentId: 'agent-2',
          salePrice: 500000,
          totalServiceFee: 25000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if selling agent is an admin', async () => {
      mockUsersService.findOne
        .mockResolvedValueOnce({ role: 'agent' })
        .mockResolvedValueOnce({ role: 'admin' });
      await expect(
        service.create({
          propertyId: 'prop-id',
          listingAgentId: 'agent-1',
          sellingAgentId: 'admin-1',
          salePrice: 500000,
          totalServiceFee: 25000,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('advanceStage — valid transitions', () => {
    it('agreement → earnest_money succeeds', async () => {
      const txn = makeTransaction({ stage: TransactionStage.agreement });
      mockFindById.mockReturnValue({ exec: () => Promise.resolve(txn) });
      mockSave.mockResolvedValue({
        ...txn,
        stage: TransactionStage.earnest_money,
      });
      const result = await service.advanceStage(
        'txn-id',
        TransactionStage.earnest_money,
      );
      expect(result.stage).toBe(TransactionStage.earnest_money);
    });

    it('earnest_money → title_deed succeeds', async () => {
      const txn = makeTransaction({ stage: TransactionStage.earnest_money });
      mockFindById.mockReturnValue({ exec: () => Promise.resolve(txn) });
      mockSave.mockResolvedValue({
        ...txn,
        stage: TransactionStage.title_deed,
      });
      const result = await service.advanceStage(
        'txn-id',
        TransactionStage.title_deed,
      );
      expect(result.stage).toBe(TransactionStage.title_deed);
    });

    it('title_deed → completed succeeds', async () => {
      const txn = makeTransaction({ stage: TransactionStage.title_deed });
      mockFindById.mockReturnValue({ exec: () => Promise.resolve(txn) });
      mockSave.mockResolvedValue({ ...txn, stage: TransactionStage.completed });
      const result = await service.advanceStage(
        'txn-id',
        TransactionStage.completed,
      );
      expect(result.stage).toBe(TransactionStage.completed);
    });
  });

  describe('advanceStage — invalid transitions', () => {
    const rejectsWithBadRequest = async (
      currentStage: TransactionStage,
      targetStage: TransactionStage,
    ) => {
      const txn = makeTransaction({ stage: currentStage });
      mockFindById.mockReturnValue({ exec: () => Promise.resolve(txn) });
      await expect(service.advanceStage('txn-id', targetStage)).rejects.toThrow(
        BadRequestException,
      );
    };

    it('agreement → title_deed throws BadRequestException (skip)', () =>
      rejectsWithBadRequest(
        TransactionStage.agreement,
        TransactionStage.title_deed,
      ));

    it('agreement → completed throws BadRequestException (skip)', () =>
      rejectsWithBadRequest(
        TransactionStage.agreement,
        TransactionStage.completed,
      ));

    it('earnest_money → agreement throws BadRequestException (backwards)', () =>
      rejectsWithBadRequest(
        TransactionStage.earnest_money,
        TransactionStage.agreement,
      ));

    it('completed → title_deed throws BadRequestException (backwards)', () =>
      rejectsWithBadRequest(
        TransactionStage.completed,
        TransactionStage.title_deed,
      ));

    it('completed → completed throws BadRequestException (already completed)', () =>
      rejectsWithBadRequest(
        TransactionStage.completed,
        TransactionStage.completed,
      ));
  });

  describe('advanceStage — side effects', () => {
    it('transitioning to completed triggers commission calculation', async () => {
      const txn = makeTransaction({ stage: TransactionStage.title_deed });
      mockFindById.mockReturnValue({ exec: () => Promise.resolve(txn) });
      mockSave.mockResolvedValue({ ...txn, stage: TransactionStage.completed });
      await service.advanceStage('txn-id', TransactionStage.completed);
      expect(mockCommissionsService.createForTransaction).toHaveBeenCalledTimes(
        1,
      );
    });

    it('transitioning to a non-completed stage does NOT trigger commission', async () => {
      const txn = makeTransaction({ stage: TransactionStage.agreement });
      mockFindById.mockReturnValue({ exec: () => Promise.resolve(txn) });
      mockSave.mockResolvedValue({
        ...txn,
        stage: TransactionStage.earnest_money,
      });
      await service.advanceStage('txn-id', TransactionStage.earnest_money);
      expect(
        mockCommissionsService.createForTransaction,
      ).not.toHaveBeenCalled();
    });
  });

  describe('General', () => {
    it('throws NotFoundException if transaction does not exist', async () => {
      mockFindById.mockReturnValue({ exec: () => Promise.resolve(null) });
      await expect(
        service.advanceStage('nonexistent-id', TransactionStage.earnest_money),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByAgent', () => {
    const makeTxns = () => [
      makeTransaction({ listingAgentId: { toString: () => 'agent-1' } }),
      makeTransaction({ sellingAgentId: { toString: () => 'agent-1' } }),
    ];

    it('queries by $or on listingAgentId and sellingAgentId', async () => {
      const txns = makeTxns();
      const mockExec = jest.fn().mockResolvedValue(txns);
      const mockPopulate = jest.fn().mockReturnValue({ exec: mockExec });
      mockFind.mockReturnValue({ populate: mockPopulate });

      await service.findByAgent('agent-1');

      expect(mockFind).toHaveBeenCalledWith({
        $or: [{ listingAgentId: 'agent-1' }, { sellingAgentId: 'agent-1' }],
      });
      expect(mockPopulate).toHaveBeenCalledWith('propertyId');
    });

    it('adds stage filter to query when stage is provided', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockPopulate = jest.fn().mockReturnValue({ exec: mockExec });
      mockFind.mockReturnValue({ populate: mockPopulate });

      await service.findByAgent('agent-1', TransactionStage.completed);

      expect(mockFind).toHaveBeenCalledWith({
        $or: [{ listingAgentId: 'agent-1' }, { sellingAgentId: 'agent-1' }],
        stage: TransactionStage.completed,
      });
    });

    it('returns the results from the model', async () => {
      const txns = makeTxns();
      const mockExec = jest.fn().mockResolvedValue(txns);
      mockFind.mockReturnValue({ populate: jest.fn().mockReturnValue({ exec: mockExec }) });

      const result = await service.findByAgent('agent-1');

      expect(result).toEqual(txns);
    });
  });
});
