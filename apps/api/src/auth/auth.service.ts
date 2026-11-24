import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { timingSafeEqual } from 'node:crypto';

const DEVELOPMENT_EMAIL = 'demo@sandbox.local';
const DEVELOPMENT_PASSWORD = 'Sandbox-Demo-Only!';
const attempts = new Map<string, { count: number; resetAt: number }>();

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  async login(email: string, password: string, clientKey = 'unknown') {
    const now = Date.now(); const current = attempts.get(clientKey);
    if (current && current.resetAt > now && current.count >= 8) throw new HttpException({ code: 'rate_limited', message: 'Trop de tentatives. Réessayez dans 15 minutes.' }, HttpStatus.TOO_MANY_REQUESTS);
    const configuredEmail = process.env.AUTH_USER_EMAIL;
    const passwordHash = process.env.AUTH_PASSWORD_HASH;
    let valid = false;
    if (configuredEmail || passwordHash) valid = Boolean(configuredEmail && passwordHash) && this.constantTimeEquals(email.trim().toLowerCase(), configuredEmail?.trim().toLowerCase() ?? '') && await bcrypt.compare(password, passwordHash ?? '');
    else if (process.env.NODE_ENV !== 'production' && process.env.DEMO_MODE !== 'false') valid = this.constantTimeEquals(email.trim().toLowerCase(), DEVELOPMENT_EMAIL) && this.constantTimeEquals(password, DEVELOPMENT_PASSWORD);
    if (!valid) { attempts.set(clientKey, { count: (current?.resetAt ?? 0) > now ? current!.count + 1 : 1, resetAt: (current?.resetAt ?? 0) > now ? current!.resetAt : now + 15 * 60 * 1000 }); throw new UnauthorizedException({ code: 'invalid_credentials', message: 'Identifiants invalides ou authentification non configurée.' }); }
    attempts.delete(clientKey);
    return { accessToken: await this.jwt.signAsync({ sub: email.trim().toLowerCase(), email: email.trim().toLowerCase(), role: 'developer' }) };
  }

  async verify(token: string) { try { return await this.jwt.verifyAsync<{ sub: string; email: string; role: string }>(token); } catch { throw new UnauthorizedException({ code: 'invalid_token', message: 'Session JWT absente, expirée ou invalide.' }); } }
  private constantTimeEquals(left: string, right: string) { const a = Buffer.from(left); const b = Buffer.from(right); return a.length === b.length && timingSafeEqual(a, b); }
}
