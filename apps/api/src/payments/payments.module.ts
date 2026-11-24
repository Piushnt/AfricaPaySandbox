import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module';
import { PaymentsController, PaymentsService } from './payments.service';
@Module({ imports: [ProvidersModule], controllers: [PaymentsController], providers: [PaymentsService], exports: [PaymentsService] })
export class PaymentsModule {}
