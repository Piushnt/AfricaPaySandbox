import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProvidersModule } from '../providers/providers.module';
import { PaymentsController, PaymentsService } from './payments.service';
import { SimulationsController } from './simulations.controller';
@Module({ imports: [AuthModule, ProvidersModule], controllers: [PaymentsController, SimulationsController], providers: [PaymentsService], exports: [PaymentsService] })
export class PaymentsModule {}
