import { Module, Controller, Get } from '@nestjs/common';
import { ProvidersModule } from './providers/providers.module';
import { PaymentsModule } from './payments/payments.module';
import { EventsController } from './events/events.controller';

@Controller('health')
class HealthController {
  @Get()
  getHealth() { return { status: 'ok', mode: 'SIMULATION', service: 'payment-sandbox-api' }; }
}

@Module({ imports: [ProvidersModule, PaymentsModule], controllers: [HealthController, EventsController] })
export class AppModule {}
