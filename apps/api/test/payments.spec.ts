import { ALLOWED_TRANSITIONS } from '@psa/contracts';

describe('payment state machine contract', () => {
  it('allows only declared transitions from PENDING', () => {
    expect(ALLOWED_TRANSITIONS.PENDING).toEqual(['PROCESSING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELLED']);
  });
  it('does not allow mutation from terminal failure states', () => {
    expect(ALLOWED_TRANSITIONS.FAILED).toEqual([]);
    expect(ALLOWED_TRANSITIONS.CANCELLED).toEqual([]);
    expect(ALLOWED_TRANSITIONS.REFUNDED).toEqual([]);
  });
  it('allows only success to enter refund processing', () => {
    expect(ALLOWED_TRANSITIONS.SUCCESS).toEqual(['REFUND_PENDING']);
  });
});
