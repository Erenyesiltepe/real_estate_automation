import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PropertyType } from '../../../common/enums/property-type.enum';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Sunny Apartment', description: 'Property title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example: '123 Main St, Istanbul',
    description: 'Property address',
  })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ enum: PropertyType, example: PropertyType.apartment })
  @IsEnum(PropertyType)
  type!: PropertyType;

  @ApiProperty({ example: 250000, description: 'Listing price' })
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Listing agent ID',
  })
  @IsMongoId()
  listingAgentId!: string;
}
