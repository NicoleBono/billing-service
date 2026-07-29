import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const startedAt = Date.now();
    let databaseStatus: 'ok' | 'unavailable' = 'ok';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      databaseStatus = 'unavailable';
    }

    return {
      status: databaseStatus === 'ok' ? 'ok' : 'degraded',
      service: 'billing-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: { status: databaseStatus, latencyMs: Date.now() - startedAt },
      },
      memory: {
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };
  }
}
