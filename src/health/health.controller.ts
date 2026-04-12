import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  health() {
    return this.healthService.health();
  }
}
