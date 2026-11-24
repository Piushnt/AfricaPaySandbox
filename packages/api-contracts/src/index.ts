export const PAYMENT_STATUSES = ['CREATED', 'PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentScenario = 'accepted' | 'declined' | 'insufficient_funds' | 'invalid_number' | 'unknown_number' | 'expired' | 'abandoned' | 'pending' | 'timeout' | 'technical_error' | 'provider_unavailable';
export interface ProviderProfile { code: string; name: string; country: 'BJ'; currency: 'XOF'; mode: 'SIMULATION'; operations: string[]; scenarios: PaymentScenario[]; }
export interface Payment { id: string; reference: string; provider: string; amount: number; currency: 'XOF'; phoneNumber: string; status: PaymentStatus; scenario: PaymentScenario; createdAt: string; updatedAt: string; events: PaymentEvent[]; }
export interface PaymentEvent { id: string; type: string; occurredAt: string; data: Record<string, unknown>; }
export interface CreatePaymentInput { provider: string; amount: number; phoneNumber: string; reference?: string; scenario?: PaymentScenario; }
export const ALLOWED_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  CREATED: ['PENDING'], PENDING: ['PROCESSING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELLED'], PROCESSING: ['SUCCESS', 'FAILED'], SUCCESS: ['REFUND_PENDING'], REFUND_PENDING: ['REFUNDED'], PARTIALLY_REFUNDED: ['REFUND_PENDING'], FAILED: [], EXPIRED: [], CANCELLED: [], REFUNDED: [],
};
