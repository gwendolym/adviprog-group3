import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller.js';

describe('AuthController', () => {
  const user = { id: 4, email: 'coolemailyay@example.com', name: null, roles: [] };
  const credentialsService = { register: vi.fn(), verify: vi.fn() };
  const signInService = { signIn: vi.fn(), signOut: vi.fn() };
  const emailVerificationService = { send: vi.fn() };
  let controller: AuthController;

  beforeEach(() => {
    vi.clearAllMocks();
    signInService.signIn.mockResolvedValue({ session: { mfa: 'none' } });
    controller = new AuthController(
      credentialsService as never,
      signInService as never,
      emailVerificationService as never,
    );
  });

  it('signs a new user in and sends a verification email', async () => {
    credentialsService.register.mockResolvedValue(user);

    await expect(controller.signUp({ email: user.email, password: 'themostsecretofallsecrets12' })).resolves.toBe(user);
    expect(signInService.signIn).toHaveBeenCalledWith('4', { method: 'password' });
    expect(emailVerificationService.send).toHaveBeenCalledWith({ id: '4', email: user.email });
  });

  it('does not sign in or send email when registration fails', async () => {
    credentialsService.register.mockRejectedValue(new Error('Email already registered'));

    await expect(controller.signUp({ email: user.email, password: 'themostsecretofallsecrets12' })).rejects.toThrow();
    expect(signInService.signIn).not.toHaveBeenCalled();
    expect(emailVerificationService.send).not.toHaveBeenCalled();
  });

  it('signs in with valid credentials', async () => {
    credentialsService.verify.mockResolvedValue(user);

    await expect(controller.signIn({ email: user.email, password: 'themostsecretofallsecrets12' })).resolves.toEqual({ mfaRequired: false });
    expect(signInService.signIn).toHaveBeenCalledWith('4', { method: 'password' });
  });

  it('reports when a second factor is still needed', async () => {
    credentialsService.verify.mockResolvedValue(user);
    signInService.signIn.mockResolvedValue({ session: { mfa: 'pending' } });

    await expect(controller.signIn({ email: user.email, password: 'themostsecretofallsecrets12' })).resolves.toEqual({ mfaRequired: true });
  });

  it('rejects invalid credentials without starting a session', async () => {
    credentialsService.verify.mockResolvedValue(null);

    await expect(controller.signIn({ email: user.email, password: 'wrong' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(signInService.signIn).not.toHaveBeenCalled();
  });

  it('signs out', async () => {
    await controller.signOut();

    expect(signInService.signOut).toHaveBeenCalled();
  });
});
