import { Controller, Get, Injectable, Module, NotFoundException, Param } from '@nestjs/common';
import { ProviderProfile } from '@psa/contracts';

@Injectable()
export class ProvidersService {
  private readonly profiles: ProviderProfile[] = [
    { code: 'mtn_benin', name: 'MTN Mobile Money Bénin (simulation)', country: 'BJ', currency: 'XOF', mode: 'SIMULATION', operations: ['payment', 'refund'], scenarios: ['accepted', 'declined', 'insufficient_funds', 'invalid_number', 'unknown_number', 'expired', 'abandoned', 'pending', 'timeout', 'technical_error', 'provider_unavailable'] },
    { code: 'moov_benin', name: 'Moov Money Bénin (simulation)', country: 'BJ', currency: 'XOF', mode: 'SIMULATION', operations: ['payment', 'refund'], scenarios: ['accepted', 'declined', 'insufficient_funds', 'invalid_number', 'unknown_number', 'expired', 'abandoned', 'pending', 'timeout', 'technical_error', 'provider_unavailable'] },
    { code: 'celtiis_benin', name: 'Celtiis Cash Bénin (simulation)', country: 'BJ', currency: 'XOF', mode: 'SIMULATION', operations: ['payment', 'refund'], scenarios: ['accepted', 'declined', 'insufficient_funds', 'invalid_number', 'unknown_number', 'expired', 'abandoned', 'pending', 'timeout', 'technical_error', 'provider_unavailable'] },
  ];
  list() { return this.profiles; }
  get(code: string) { const profile = this.profiles.find((p) => p.code === code); if (!profile) throw new NotFoundException({ code: 'provider_not_found', message: `Profil sandbox inconnu: ${code}` }); return profile; }
}

@Controller('providers')
class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}
  @Get() list() { return { data: this.providers.list() }; }
  @Get(':code/capabilities') capabilities(@Param('code') code: string) { return { data: this.providers.get(code) }; }
}
@Module({ controllers: [ProvidersController], providers: [ProvidersService], exports: [ProvidersService] })
export class ProvidersModule {}
