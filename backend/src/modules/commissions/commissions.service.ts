import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CommissionBreakdown,
  CommissionBreakdownDocument,
} from './schemas/commissions.schema';

export interface BreakdownResult {
  agencyAmount: number;
  listingAgentAmount: number;
  sellingAgentAmount: number;
  isSameAgent: boolean;
}

@Injectable()
export class CommissionsService {
  constructor(
    @InjectModel(CommissionBreakdown.name)
    private breakdownModel: Model<CommissionBreakdownDocument>,
  ) {}

  calculateBreakdown(
    totalServiceFee: number,
    isSameAgent: boolean,
  ): BreakdownResult {
    if (totalServiceFee <= 0) {
      throw new BadRequestException('totalServiceFee must be positive');
    }
    const agencyAmount = totalServiceFee * 0.5;
    const agentPool = totalServiceFee * 0.5;
    return {
      agencyAmount,
      listingAgentAmount: isSameAgent ? agentPool : agentPool * 0.5,
      sellingAgentAmount: isSameAgent ? 0 : agentPool * 0.5,
      isSameAgent,
    };
  }

  async createForTransaction(
    transactionId: string,
    listingAgentId: string,
    sellingAgentId: string,
    totalServiceFee: number,
  ): Promise<CommissionBreakdownDocument> {
    const isSameAgent = listingAgentId === sellingAgentId;
    const breakdown = this.calculateBreakdown(totalServiceFee, isSameAgent);
    const doc = new this.breakdownModel({
      transactionId,
      listingAgentId,
      sellingAgentId,
      ...breakdown,
      calculatedAt: new Date(),
    });
    return doc.save();
  }

  async findByTransaction(
    transactionId: string,
  ): Promise<CommissionBreakdownDocument> {
    const breakdown = await this.breakdownModel
      .findOne({ transactionId })
      .exec();
    if (!breakdown) {
      throw new NotFoundException(
        `No commission breakdown found for transaction ${transactionId}`,
      );
    }
    return breakdown;
  }

  findByAgent(agentId: string): Promise<CommissionBreakdownDocument[]> {
    return this.breakdownModel
      .find({ $or: [{ listingAgentId: agentId }, { sellingAgentId: agentId }] })
      .exec();
  }
}
