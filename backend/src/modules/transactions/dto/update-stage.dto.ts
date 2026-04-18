import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TransactionStage } from '../../../common/enums/transaction-stage.enum';

export class UpdateStageDto {
  @ApiProperty({
    enum: TransactionStage,
    example: TransactionStage.earnest_money,
  })
  @IsEnum(TransactionStage)
  stage!: TransactionStage;
}
