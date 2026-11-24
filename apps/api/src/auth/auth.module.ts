import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

const developmentSecret = randomBytes(48).toString('hex');
@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET?.trim() || developmentSecret, signOptions: { algorithm: 'HS256', expiresIn: '1h' } })],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {
  constructor() {
    if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET?.trim() || !process.env.AUTH_USER_EMAIL?.trim() || !process.env.AUTH_PASSWORD_HASH?.trim())) {
      throw new Error('Production requires JWT_SECRET, AUTH_USER_EMAIL, and AUTH_PASSWORD_HASH.');
    }
    if (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === 'false') throw new Error('COOKIE_SECURE must remain true in production.');
    if (process.env.NODE_ENV !== 'production' && !process.env.JWT_SECRET?.trim()) console.warn('JWT_SECRET absent: une clé de démonstration éphémère est utilisée et les sessions expireront au redémarrage.');
  }
}
