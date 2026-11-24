import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from '../payments/payments.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly payments: PaymentsService) {}
  @Get() list() { return { data: this.payments.listEvents() }; }
}
