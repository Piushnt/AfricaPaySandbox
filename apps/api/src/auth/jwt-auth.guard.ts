import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const cookie = request.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith('psa_access_token='))?.slice('psa_access_token='.length);
    const bearer = request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : undefined;
    const token = bearer ?? cookie;
    if (!token) throw new UnauthorizedException({ code: 'authentication_required', message: 'Connectez-vous pour accéder à cette ressource.' });
    if (!bearer && request.headers['x-psa-request'] !== 'dashboard') throw new UnauthorizedException({ code: 'csrf_header_required', message: 'En-tête X-PSA-Request manquant.' });
    (request as Request & { user: unknown }).user = await this.auth.verify(token);
    return true;
  }
}
