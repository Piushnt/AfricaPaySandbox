import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentScenario } from '@psa/contracts';
import { IsIn, IsString } from 'class-validator';
import { PaymentsService } from './payments.service';

const scenarioCodes: PaymentScenario[] = ['accepted', 'declined', 'insufficient_funds', 'invalid_number', 'unknown_number', 'expired', 'abandoned', 'pending', 'timeout', 'technical_error', 'provider_unavailable'];
const scenarioDescriptions: Record<PaymentScenario, string> = {
  accepted: 'Confirme le paiement simulé.', declined: 'Refuse le paiement simulé.', insufficient_funds: 'Simule un solde insuffisant.', invalid_number: 'Simule un numéro de téléphone invalide.', unknown_number: 'Simule un compte non enregistré ou inconnu.', expired: 'Simule l’expiration de la demande.', abandoned: 'Simule l’abandon du parcours par le client.', pending: 'Laisse le paiement en attente pour inspection ou test ultérieur.', timeout: 'Simule un délai d’attente du fournisseur.', technical_error: 'Simule une erreur technique ou réseau.', provider_unavailable: 'Simule l’indisponibilité temporaire du profil fournisseur.',
};
class RunScenarioDto {
  @IsString() @IsIn(scenarioCodes) scenario!: PaymentScenario;
}

@ApiTags('simulations')
@Controller('simulations')
export class SimulationsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('scenarios')
  @ApiOperation({ summary: 'Lister les scénarios déterministes disponibles' })
  listScenarios() {
    return { simulation: true, data: scenarioCodes.map((code) => ({ code, description: scenarioDescriptions[code] })) };
  }

  @Post('payments/:paymentId/run')
  @ApiOperation({ summary: 'Exécuter un scénario sur un paiement PENDING ou PROCESSING' })
  run(@Param('paymentId') paymentId: string, @Body() body: RunScenarioDto) {
    if (!body?.scenario) throw new BadRequestException({ code: 'scenario_required', message: 'Le champ scenario est obligatoire.' });
    return { simulation: true, data: this.payments.runScenario(paymentId, body.scenario) };
  }
}
