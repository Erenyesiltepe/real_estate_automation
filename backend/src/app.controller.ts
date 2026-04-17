import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'MongoDB connection health check' })
  @ApiResponse({ status: 200, description: 'Database connection state' })
  getHealth(): object {
    return this.appService.getHealth();
  }
}
