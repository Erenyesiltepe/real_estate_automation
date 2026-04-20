import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TransactionStage } from '../../../common/enums/transaction-stage.enum';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Property' })
  propertyId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  listingAgentId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  sellingAgentId!: Types.ObjectId;

  @Prop({ required: true })
  salePrice!: number;

  @Prop({ required: true })
  totalServiceFee!: number;

  @Prop({
    required: true,
    type: String,
    enum: TransactionStage,
    default: TransactionStage.agreement,
  })
  stage!: TransactionStage;

  @Prop({ required: true, default: () => new Date() })
  stageUpdatedAt!: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
