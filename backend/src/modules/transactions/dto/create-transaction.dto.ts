import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, IsPositive } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Property ID' })
  @IsMongoId()
  propertyId!: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Listing agent ID' })
  @IsMongoId()
  listingAgentId!: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Selling agent ID' })
  @IsMongoId()
  sellingAgentId!: string;

  @ApiProperty({ example: 500000, description: 'Final agreed sale price' })
  @IsNumber()
  @IsPositive()
  salePrice!: number;

  @ApiProperty({ example: 25000, description: 'Total service fee (entered by admin)' })
  @IsNumber()
  @IsPositive()
  totalServiceFee!: number;
}
