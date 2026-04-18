import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommissionBreakdownDocument = HydratedDocument<CommissionBreakdown>;

@Schema()
export class CommissionBreakdown {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Transaction' })
  transactionId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  listingAgentId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  sellingAgentId!: Types.ObjectId;

  @Prop({ required: true })
  agencyAmount!: number;

  @Prop({ required: true })
  listingAgentAmount!: number;

  @Prop({ required: true })
  sellingAgentAmount!: number;

  @Prop({ required: true })
  isSameAgent!: boolean;

  @Prop({ required: true, default: () => new Date() })
  calculatedAt!: Date;
}

export const CommissionBreakdownSchema =
  SchemaFactory.createForClass(CommissionBreakdown);
