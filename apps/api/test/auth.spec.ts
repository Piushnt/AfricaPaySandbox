import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/auth/auth.service';

describe('JWT authentication', () => {
  const service = new AuthService(new JwtService({ secret: 'test-only-jwt-secret', signOptions: { expiresIn: '1h' } }));
  it('issues a verifiable short-lived demo token outside production', async () => {
    const { accessToken } = await service.login('demo@sandbox.local', 'Sandbox-Demo-Only!', 'auth-test-valid');
    const claims = await service.verify(accessToken);
    expect(claims.email).toBe('demo@sandbox.local');
    expect(claims.role).toBe('developer');
  });
  it('rejects invalid credentials', async () => {
    await expect(service.login('demo@sandbox.local', 'incorrect-password', 'auth-test-invalid')).rejects.toThrow('Identifiants invalides');
  });
  it('rejects a modified JWT', async () => {
    await expect(service.verify('eyJhbGciOiJIUzI1NiJ9.invalid.signature')).rejects.toThrow('Session JWT');
  });
  it('limits repeated invalid login attempts', async () => {
    const clientKey = `auth-test-rate-${Date.now()}`;
    for (let i = 0; i < 8; i++) await expect(service.login('wrong@sandbox.local', 'incorrect-password', clientKey)).rejects.toThrow('Identifiants invalides');
    await expect(service.login('wrong@sandbox.local', 'incorrect-password', clientKey)).rejects.toMatchObject({ status: 429 });
  });
});
