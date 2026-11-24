import { BadRequestException, Body, Controller, Headers, Injectable, NotFoundException, Param, Post, Get, ConflictException, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ALLOWED_TRANSITIONS, CreatePaymentInput, Payment, PaymentEvent, PaymentScenario, PaymentStatus } from '@psa/contracts';
import { IsIn, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { ProvidersService } from '../providers/providers.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const SCENARIOS: readonly PaymentScenario[] = ['accepted', 'declined', 'insufficient_funds', 'invalid_number', 'unknown_number', 'expired', 'abandoned', 'pending', 'timeout', 'technical_error', 'provider_unavailable'];

class CreatePaymentDto implements CreatePaymentInput {
  @IsString() @IsIn(['mtn_benin', 'moov_benin', 'celtiis_benin']) provider!: string;
  @IsInt() @Min(1) amount!: number;
  @IsString() @Length(6, 20) phoneNumber!: string;
  @IsOptional() @IsString() @Length(1, 100) reference?: string;
  @IsOptional() @IsIn(SCENARIOS) scenario?: PaymentScenario;
}

@Injectable()
export class PaymentsService {
  private readonly records = new Map<string, Payment>();
  private readonly idempotency = new Map<string, { fingerprint: string; paymentId: string }>();
  private readonly eventLog: PaymentEvent[] = [];
  constructor(private readonly providers: ProvidersService) {}

  listEvents() { return this.eventLog.slice().reverse(); }
  listPayments() { return [...this.records.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  get(id: string) { const p = this.records.get(id); if (!p) throw new NotFoundException({ code: 'payment_not_found', message: 'Paiement introuvable.' }); return p; }

  create(input: CreatePaymentInput, idemKey?: string) {
    this.providers.get(input.provider);
    if (!Number.isSafeInteger(input.amount) || input.amount <= 0) throw new BadRequestException({ code: 'invalid_amount', message: 'Le montant doit être un entier positif en XOF.' });
    if (input.scenario === 'invalid_number') throw new BadRequestException({ code: 'invalid_phone_number', message: 'Numéro de test invalide pour ce scénario.' });
    const normalized = { provider: input.provider, amount: input.amount, phoneNumber: input.phoneNumber, reference: input.reference ?? null, scenario: input.scenario ?? 'accepted' };
    const fingerprint = JSON.stringify(normalized);
    if (idemKey) {
      const previous = this.idempotency.get(idemKey);
      if (previous) { if (previous.fingerprint !== fingerprint) throw new ConflictException({ code: 'idempotency_conflict', message: 'Cette Idempotency-Key est déjà associée à une autre requête.' }); return this.get(previous.paymentId); }
    }
    const now = new Date().toISOString();
    const payment: Payment = { id: `pay_${crypto.randomUUID().replaceAll('-', '').slice(0, 20)}`, reference: input.reference ?? `ref_${crypto.randomUUID().slice(0, 12)}`, provider: input.provider, amount: input.amount, currency: 'XOF', phoneNumber: input.phoneNumber, status: 'CREATED', scenario: input.scenario ?? 'accepted', createdAt: now, updatedAt: now, events: [] };
    this.records.set(payment.id, payment);
    if (idemKey) this.idempotency.set(idemKey, { fingerprint, paymentId: payment.id });
    this.transition(payment, 'PENDING', 'payment.pending');
    if (payment.scenario !== 'pending' && payment.scenario !== 'abandoned') {
      const target = this.statusForScenario(payment.scenario);
      setTimeout(() => { const current = this.records.get(payment.id); if (current?.status === 'PENDING') this.transition(current, target, this.eventForStatus(target)); }, 700).unref?.();
    }
    return payment;
  }

  runScenario(id: string, scenario: PaymentScenario) {
    if (!SCENARIOS.includes(scenario)) throw new BadRequestException({ code: 'unsupported_scenario', message: 'Scénario de simulation non pris en charge.' });
    const payment = this.get(id);
    if (payment.status !== 'PENDING' && payment.status !== 'PROCESSING') throw new ConflictException({ code: 'payment_not_simulatable', message: `Le scénario ne peut pas être lancé pour un paiement à l’état ${payment.status}.` });
    payment.scenario = scenario;
    if (scenario === 'pending') { this.log(payment, 'payment.simulation.waiting', { scenario }); return payment; }
    if (scenario === 'abandoned') { this.transition(payment, 'CANCELLED', 'payment.cancelled', { scenario, reason: 'customer_abandoned' }); return payment; }
    const target = this.statusForScenario(scenario);
    if (target === 'SUCCESS' || target === 'FAILED' || target === 'EXPIRED') {
      this.transition(payment, target, this.eventForStatus(target), { scenario });
    } else if (target === 'PROCESSING') {
      if (payment.status === 'PENDING') this.transition(payment, 'PROCESSING', 'payment.processing', { scenario });
      this.transition(payment, 'FAILED', 'payment.failed', { scenario });
    }
    return payment;
  }

  cancel(id: string) { const p = this.get(id); this.transition(p, 'CANCELLED', 'payment.cancelled'); return p; }
  refund(id: string, amount?: number) {
    const p = this.get(id);
    if (p.status !== 'SUCCESS' && p.status !== 'PARTIALLY_REFUNDED') throw new ConflictException({ code: 'payment_not_refundable', message: 'Seul un paiement réussi peut être remboursé.' });
    if (amount !== undefined && (amount <= 0 || amount > p.amount)) throw new BadRequestException({ code: 'invalid_refund_amount', message: 'Montant de remboursement invalide.' });
    this.transition(p, 'REFUND_PENDING', 'refund.created');
    const finalStatus: PaymentStatus = amount !== undefined && amount < p.amount ? 'PARTIALLY_REFUNDED' : 'REFUNDED';
    setTimeout(() => { const current = this.records.get(p.id); if (current?.status === 'REFUND_PENDING') this.transition(current, finalStatus, finalStatus === 'REFUNDED' ? 'refund.success' : 'refund.partial'); }, 300).unref?.();
    return { id: `ref_${crypto.randomUUID().slice(0, 12)}`, paymentId: p.id, amount: amount ?? p.amount, currency: 'XOF', status: 'REFUND_PENDING' };
  }

  private statusForScenario(scenario: PaymentScenario): PaymentStatus {
    if (scenario === 'accepted') return 'SUCCESS';
    if (scenario === 'expired') return 'EXPIRED';
    if (scenario === 'timeout' || scenario === 'technical_error' || scenario === 'provider_unavailable' || scenario === 'declined' || scenario === 'insufficient_funds' || scenario === 'invalid_number' || scenario === 'unknown_number') return 'FAILED';
    return 'PROCESSING';
  }
  private eventForStatus(status: PaymentStatus) { return status === 'SUCCESS' ? 'payment.success' : status === 'FAILED' ? 'payment.failed' : status === 'EXPIRED' ? 'payment.expired' : 'payment.processing'; }
  private log(payment: Payment, type: string, data: Record<string, unknown>) {
    const event: PaymentEvent = { id: `evt_${crypto.randomUUID().slice(0, 16)}`, type, occurredAt: new Date().toISOString(), data: { payment_id: payment.id, status: payment.status, ...data } };
    payment.updatedAt = event.occurredAt; payment.events.push(event); this.eventLog.push(event);
  }
  private transition(payment: Payment, next: PaymentStatus, type: string, extra: Record<string, unknown> = {}) {
    if (!ALLOWED_TRANSITIONS[payment.status].includes(next)) throw new ConflictException({ code: 'invalid_state_transition', message: `Transition ${payment.status} → ${next} interdite.` });
    const event: PaymentEvent = { id: `evt_${crypto.randomUUID().slice(0, 16)}`, type, occurredAt: new Date().toISOString(), data: { payment_id: payment.id, status: next, ...extra } };
    payment.status = next; payment.updatedAt = event.occurredAt; payment.events.push(event); this.eventLog.push(event);
  }
}

@ApiTags('payments')
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Post() @ApiOperation({ summary: 'Créer un paiement simulé' }) @ApiHeader({ name: 'Idempotency-Key', required: false })
  create(@Body() body: CreatePaymentDto, @Headers('idempotency-key') key?: string) { return { data: this.payments.create(body, key), simulation: true }; }
  @Get() list() { return { data: this.payments.listPayments() }; }
  @Get(':id') get(@Param('id') id: string) { return { data: this.payments.get(id) }; }
  @Post(':id/cancel') cancel(@Param('id') id: string) { return { data: this.payments.cancel(id), simulation: true }; }
  @Post(':id/refunds') refund(@Param('id') id: string, @Body() body: { amount?: number }) { return { data: this.payments.refund(id, body?.amount), simulation: true }; }
}
