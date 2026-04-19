import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
} from './schemas/transactions.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionStage } from '../../common/enums/transaction-stage.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { PropertiesService } from '../properties/properties.service';
import { CommissionsService } from '../commissions/commissions.service';

const STAGE_ORDER: TransactionStage[] = [
  TransactionStage.agreement,
  TransactionStage.earnest_money,
  TransactionStage.title_deed,
  TransactionStage.completed,
];

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    private readonly usersService: UsersService,
    private readonly propertiesService: PropertiesService,
    private readonly commissionsService: CommissionsService,
  ) {}

  async create(dto: CreateTransactionDto): Promise<TransactionDocument> {
    const [listingAgent, sellingAgent] = await Promise.all([
      this.usersService.findOne(dto.listingAgentId),
      this.usersService.findOne(dto.sellingAgentId),
      this.propertiesService.findOne(dto.propertyId),
    ]);
    if (listingAgent.role !== UserRole.agent || sellingAgent.role !== UserRole.agent) {
      throw new BadRequestException('Listing and selling agents must have the agent role');
    }
    const created = new this.transactionModel({
      ...dto,
      stage: TransactionStage.agreement,
      stageUpdatedAt: new Date(),
    });
    return created.save();
  }

  findAll(stage?: TransactionStage): Promise<TransactionDocument[]> {
    const filter = stage ? { stage } : {};
    return this.transactionModel.find(filter).exec();
  }

  async findOne(id: string): Promise<TransactionDocument> {
    const transaction = await this.transactionModel
      .findById(id)
      .populate('propertyId')
      .populate('listingAgentId')
      .populate('sellingAgentId')
      .exec();
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }
    return transaction;
  }

  async advanceStage(
    id: string,
    newStage: TransactionStage,
  ): Promise<TransactionDocument> {
    const transaction = await this.transactionModel.findById(id).exec();
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    const currentIdx = STAGE_ORDER.indexOf(transaction.stage);
    const nextIdx = STAGE_ORDER.indexOf(newStage);
    if (nextIdx !== currentIdx + 1) {
      throw new BadRequestException(
        `Invalid stage transition: ${transaction.stage} → ${newStage}`,
      );
    }

    transaction.stage = newStage;
    transaction.stageUpdatedAt = new Date();
    const saved = await transaction.save();

    if (newStage === TransactionStage.completed) {
      await this.commissionsService.createForTransaction(
        id,
        transaction.listingAgentId.toString(),
        transaction.sellingAgentId.toString(),
        transaction.totalServiceFee,
      );
    }

    return saved;
  }
}
