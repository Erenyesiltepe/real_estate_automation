import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsService } from './commissions.service';
import { CommissionBreakdown } from './schemas/commissions.schema';

describe('CommissionsService', () => {
  let service: CommissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        { provide: getModelToken(CommissionBreakdown.name), useValue: {} },
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
  });

  const fee = 10000;

  describe('Scenario 1 — same agent', () => {
    let result: ReturnType<CommissionsService['calculateBreakdown']>;
    beforeEach(() => {
      result = service.calculateBreakdown(fee, true);
    });

    it('agency gets 50% of totalServiceFee', () => {
      expect(result.agencyAmount).toBe(fee * 0.5);
    });

    it('listingAgentAmount equals 50% of totalServiceFee', () => {
      expect(result.listingAgentAmount).toBe(fee * 0.5);
    });

    it('sellingAgentAmount equals 0', () => {
      expect(result.sellingAgentAmount).toBe(0);
    });

    it('isSameAgent is true', () => {
      expect(result.isSameAgent).toBe(true);
    });
  });

  describe('Scenario 2 — different agents', () => {
    let result: ReturnType<CommissionsService['calculateBreakdown']>;
    beforeEach(() => {
      result = service.calculateBreakdown(fee, false);
    });

    it('agency gets 50% of totalServiceFee', () => {
      expect(result.agencyAmount).toBe(fee * 0.5);
    });

    it('listingAgentAmount equals 25% of totalServiceFee', () => {
      expect(result.listingAgentAmount).toBe(fee * 0.25);
    });

    it('sellingAgentAmount equals 25% of totalServiceFee', () => {
      expect(result.sellingAgentAmount).toBe(fee * 0.25);
    });

    it('isSameAgent is false', () => {
      expect(result.isSameAgent).toBe(false);
    });
  });

  describe('General', () => {
    it('amounts sum to totalServiceFee — same agent', () => {
      const r = service.calculateBreakdown(fee, true);
      expect(r.agencyAmount + r.listingAgentAmount + r.sellingAgentAmount).toBe(
        fee,
      );
    });

    it('amounts sum to totalServiceFee — different agents', () => {
      const r = service.calculateBreakdown(fee, false);
      expect(r.agencyAmount + r.listingAgentAmount + r.sellingAgentAmount).toBe(
        fee,
      );
    });

    it('throws BadRequestException if totalServiceFee is zero', () => {
      expect(() => service.calculateBreakdown(0, false)).toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException if totalServiceFee is negative', () => {
      expect(() => service.calculateBreakdown(-500, false)).toThrow(
        BadRequestException,
      );
    });
  });
});
