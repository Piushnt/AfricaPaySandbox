import { Module, Controller, Get } from '@nestjs/common';
import { ProvidersModule } from './providers/providers.module';
import { PaymentsModule } from './payments/payments.module';
import { EventsController } from './events/events.controller';
import { AuthModule } from './auth/auth.module';

@Controller('health')
class HealthController {
  @Get()
  getHealth() { return { status: 'ok', mode: 'SIMULATION', service: 'payment-sandbox-api' }; }
}

@Module({ imports: [AuthModule, ProvidersModule, PaymentsModule], controllers: [HealthController, EventsController] })
export class AppModule {}
