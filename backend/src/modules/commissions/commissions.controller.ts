import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';

@ApiTags('commissions')
@ApiBearerAuth()
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get('transaction/:transactionId')
  @ApiOperation({ summary: 'Get commission breakdown for a transaction' })
  @ApiResponse({ status: 200, description: 'Commission breakdown' })
  @ApiResponse({
    status: 404,
    description: 'Transaction not completed or not found',
  })
  findByTransaction(@Param('transactionId') transactionId: string) {
    return this.commissionsService.findByTransaction(transactionId);
  }

  @Get('agent/:agentId')
  @ApiOperation({ summary: 'Get all commission breakdowns for an agent' })
  @ApiResponse({ status: 200, description: 'List of commission breakdowns' })
  findByAgent(@Param('agentId') agentId: string) {
    return this.commissionsService.findByAgent(agentId);
  }
}
