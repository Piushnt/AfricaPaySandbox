import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

class LoginDto { @IsEmail() email!: string; @IsString() @MinLength(10) password!: string; }
const COOKIE = 'psa_access_token';
function cookieOptions() { const secure = process.env.COOKIE_SECURE !== 'false'; return { httpOnly: true, secure, sameSite: (secure ? 'none' : 'lax') as 'none' | 'lax', path: '/', maxAge: 60 * 60 * 1000 }; }
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login') @ApiOperation({ summary: 'Ouvrir une session de test JWT' })
  async login(@Body() body: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    if (!body?.email || !body?.password) throw new UnauthorizedException({ code: 'credentials_required', message: 'E-mail et mot de passe requis.' });
    const { accessToken } = await this.auth.login(body.email, body.password, request.ip ?? 'unknown');
    response.cookie(COOKIE, accessToken, cookieOptions());
    return { data: { authenticated: true, expiresIn: 3600 }, simulation: true };
  }
  @Get('me') @ApiOperation({ summary: 'Vérifier la session JWT courante' })
  async me(@Req() request: Request) { const token = this.tokenFrom(request); const user = await this.auth.verify(token); return { data: { email: user.email, role: user.role } }; }
  @Post('logout') @ApiOperation({ summary: 'Fermer la session' })
  logout(@Res({ passthrough: true }) response: Response) { response.clearCookie(COOKIE, cookieOptions()); return { data: { authenticated: false } }; }
  private tokenFrom(request: Request) { const cookie = request.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1); const bearer = request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : undefined; const token = bearer ?? cookie; if (!token) throw new UnauthorizedException({ code: 'authentication_required', message: 'Connectez-vous pour accéder à cette ressource.' }); return token; }
}
