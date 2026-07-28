import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  async check() {
    const startedAt = Date.now();
    let databaseStatus: 'ok' | 'unavailable' = 'ok';

    try {
      await this.connection.db?.admin().ping();
    } catch {
      databaseStatus = 'unavailable';
    }

    return {
      status: databaseStatus === 'ok' ? 'ok' : 'degraded',
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
