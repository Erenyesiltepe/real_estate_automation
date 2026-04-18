import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PropertyType } from '../../../common/enums/property-type.enum';
import { PropertyStatus } from '../../../common/enums/property-status.enum';

export type PropertyDocument = HydratedDocument<Property>;

@Schema({ timestamps: true })
export class Property {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  address!: string;

  @Prop({ required: true, type: String, enum: PropertyType })
  type!: PropertyType;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  listingAgentId!: Types.ObjectId;

  @Prop({
    required: true,
    type: String,
    enum: PropertyStatus,
    default: PropertyStatus.available,
  })
  status!: PropertyStatus;
}

export const PropertySchema = SchemaFactory.createForClass(Property);
