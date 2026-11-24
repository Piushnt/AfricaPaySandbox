import { ConflictException } from '@nestjs/common';
import { PaymentsService } from '../src/payments/payments.service';
import { ProvidersService } from '../src/providers/providers.module';

describe('deterministic payment simulation', () => {
  const makeService = () => new PaymentsService({ get: jest.fn() } as unknown as ProvidersService);

  it('runs an accepted scenario and records the terminal event', () => {
    const service = makeService();
    const payment = service.create({ provider: 'mtn_benin', amount: 5000, phoneNumber: '0197000000', scenario: 'pending' });
    const result = service.runScenario(payment.id, 'accepted');
    expect(result.status).toBe('SUCCESS');
    expect(result.events.at(-1)?.type).toBe('payment.success');
  });

  it('maps insufficient funds to FAILED and records the selected scenario', () => {
    const service = makeService();
    const payment = service.create({ provider: 'moov_benin', amount: 5000, phoneNumber: '0197000000', scenario: 'pending' });
    const result = service.runScenario(payment.id, 'insufficient_funds');
    expect(result.status).toBe('FAILED');
    expect(result.events.at(-1)?.data.scenario).toBe('insufficient_funds');
  });

  it('keeps pending when pending is selected', () => {
    const service = makeService();
    const payment = service.create({ provider: 'celtiis_benin', amount: 5000, phoneNumber: '0197000000', scenario: 'pending' });
    expect(service.runScenario(payment.id, 'pending').status).toBe('PENDING');
  });

  it('rejects simulation after terminal state', () => {
    const service = makeService();
    const payment = service.create({ provider: 'mtn_benin', amount: 5000, phoneNumber: '0197000000', scenario: 'pending' });
    service.runScenario(payment.id, 'accepted');
    expect(() => service.runScenario(payment.id, 'declined')).toThrow(ConflictException);
  });
});
