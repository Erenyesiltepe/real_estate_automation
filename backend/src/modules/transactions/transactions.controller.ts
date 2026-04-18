import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import { TransactionStage } from '../../common/enums/transaction-stage.enum';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Property or agent not found' })
  create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all transactions' })
  @ApiQuery({ name: 'stage', enum: TransactionStage, required: false })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  findAll(@Query('stage') stage?: TransactionStage) {
    return this.transactionsService.findAll(stage);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a transaction by ID (agents and property populated)',
  })
  @ApiResponse({ status: 200, description: 'Transaction detail' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id/stage')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Advance transaction to next stage' })
  @ApiResponse({ status: 200, description: 'Stage advanced' })
  @ApiResponse({ status: 400, description: 'Invalid stage transition' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  advanceStage(@Param('id') id: string, @Body() dto: UpdateStageDto) {
    return this.transactionsService.advanceStage(id, dto.stage);
  }
}
