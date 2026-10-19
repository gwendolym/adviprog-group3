import type { OidcProfile } from '@nestjs/authentication';
import { AppOidcAccountResolver } from './oidc-account.resolver.js';

describe('AppOidcAccountResolver', () => {
  const usersRepository = {
    findByOAuthAccount: vi.fn(),
    findByEmail: vi.fn(),
    findVerifiedByEmail: vi.fn(),
    linkOAuthAccount: vi.fn(),
    createWithOAuthAccount: vi.fn(),
  };
  const registry = { registerHandler: vi.fn() };
  let resolver: AppOidcAccountResolver;

  const profile = (overrides: Partial<OidcProfile> = {}): OidcProfile => ({
    provider: 'google',
    subject: 'google-sub-1',
    email: 'ada@example.com',
    emailVerified: true,
    name: 'Ada',
    claims: {},
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    usersRepository.findByOAuthAccount.mockResolvedValue(null);
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.findVerifiedByEmail.mockResolvedValue(null);
    resolver = new AppOidcAccountResolver(usersRepository as never, registry as never);
  });

  it('signs in the user an identity is already linked to', async () => {
    usersRepository.findByOAuthAccount.mockResolvedValue({ id: 7 });

    await expect(resolver.resolveUser(profile(), {}, {})).resolves.toEqual({ id: '7' });
    expect(usersRepository.createWithOAuthAccount).not.toHaveBeenCalled();
  });

  it('creates an account for a new verified email', async () => {
    usersRepository.createWithOAuthAccount.mockResolvedValue({ id: 3 });

    await expect(resolver.resolveUser(profile(), {}, {})).resolves.toEqual({ id: '3' });
    expect(usersRepository.createWithOAuthAccount).toHaveBeenCalledWith('ada@example.com', 'Ada', 'google', 'google-sub-1');
  });

  it('links to an existing account whose email is verified', async () => {
    usersRepository.findByEmail.mockResolvedValue({ id: 5 });
    usersRepository.findVerifiedByEmail.mockResolvedValue({ id: 5 });

    await expect(resolver.resolveUser(profile(), {}, {})).resolves.toEqual({ id: '5' });
    expect(usersRepository.linkOAuthAccount).toHaveBeenCalledWith(5, 'google', 'google-sub-1');
  });

  it('refuses an existing account whose email is unverified', async () => {
    usersRepository.findByEmail.mockResolvedValue({ id: 5 });

    await expect(resolver.resolveUser(profile(), {}, {})).resolves.toBeNull();
    expect(usersRepository.linkOAuthAccount).not.toHaveBeenCalled();
  });

  it('refuses an email the provider did not verify', async () => {
    await expect(resolver.resolveUser(profile({ emailVerified: false }), {}, {})).resolves.toBeNull();
    expect(usersRepository.createWithOAuthAccount).not.toHaveBeenCalled();
  });

  it('refuses to link an identity that belongs to another user', async () => {
    usersRepository.findByOAuthAccount.mockResolvedValue({ id: 9 });

    await expect(resolver.resolveUser(profile(), {}, { linkTo: { id: '5' } })).rejects.toThrow('already linked');
  });
});
