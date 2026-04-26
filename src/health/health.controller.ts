import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Verificar el estado de la aplicación' })
  health(): {
    status: string;
    timestamp: string;
    env: string;
  } {
    return this.healthService.health();
  }
}
