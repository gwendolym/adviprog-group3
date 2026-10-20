import { ConflictException } from '@nestjs/common';
import { CredentialsService } from './credentials.service.js';

describe('CredentialsService', () => {
  const user = { id: 1, email: 'coolemailyay@example.com', name: null, roles: [] };
  const usersRepository = {
    findByEmail: vi.fn(),
    create: vi.fn(),
    findCredentials: vi.fn(),
    updatePasswordHash: vi.fn(),
  };
  const passwordHasher = { hash: vi.fn(), verify: vi.fn(), needsRehash: vi.fn() };
  let service: CredentialsService;

  beforeEach(() => {
    vi.clearAllMocks();
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.create.mockResolvedValue(user);
    passwordHasher.hash.mockResolvedValue('hashed');
    passwordHasher.needsRehash.mockReturnValue(false);
    service = new CredentialsService(usersRepository as never, passwordHasher as never);
  });

  describe('register', () => {
    it('stores a hash of the password, never the password itself', async () => {
      await expect(service.register('coolemailyay@example.com', 'themostsecretofallsecrets123')).resolves.toBe(user);
      expect(passwordHasher.hash).toHaveBeenCalledWith('themostsecretofallsecrets123');
      expect(usersRepository.create).toHaveBeenCalledWith('coolemailyay@example.com', { passwordHash: 'hashed' });
    });

    it('refuses an email that is already registered', async () => {
      usersRepository.findByEmail.mockResolvedValue(user);

      await expect(service.register('coolemailyay@example.com', 'themostsecretofallsecrets123')).rejects.toBeInstanceOf(ConflictException);
      expect(usersRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('verify', () => {
    it('returns the user for the right password', async () => {
      usersRepository.findCredentials.mockResolvedValue({ user, passwordHash: 'stored' });
      passwordHasher.verify.mockResolvedValue(true);

      await expect(service.verify('coolemailyay@example.com', 'themostsecretofallsecrets123')).resolves.toBe(user);
      expect(passwordHasher.verify).toHaveBeenCalledWith('themostsecretofallsecrets123', 'stored');
    });

    it('returns null for a wrong password', async () => {
      usersRepository.findCredentials.mockResolvedValue({ user, passwordHash: 'stored' });
      passwordHasher.verify.mockResolvedValue(false);

      await expect(service.verify('coolemailyay@example.com', 'wrong')).resolves.toBeNull();
    });

    it('still checks a password for an unknown email, so timing does not reveal if an account exists or not', async () => {
      usersRepository.findCredentials.mockResolvedValue(null);
      passwordHasher.verify.mockResolvedValue(false);

      await expect(service.verify('nobody@example.com', 'themostsecretofallsecrets123')).resolves.toBeNull();
      expect(passwordHasher.verify).toHaveBeenCalledWith('themostsecretofallsecrets123', undefined);
    });

    it('returns null for an account without a password, even if the hasher says yes', async () => {
      usersRepository.findCredentials.mockResolvedValue({ user, passwordHash: null });
      passwordHasher.verify.mockResolvedValue(true);

      await expect(service.verify('coolemailyay@example.com', 'themostsecretofallsecrets123')).resolves.toBeNull();
    });

    it('upgrades an outdated hash after a successful sign-in', async () => {
      usersRepository.findCredentials.mockResolvedValue({ user, passwordHash: 'old' });
      passwordHasher.verify.mockResolvedValue(true);
      passwordHasher.needsRehash.mockReturnValue(true);

      await service.verify('coolemailyay@example.com', 'themostsecretofallsecrets123');

      expect(usersRepository.updatePasswordHash).toHaveBeenCalledWith(1, 'hashed');
    });

    it('leaves a current hash alone', async () => {
      usersRepository.findCredentials.mockResolvedValue({ user, passwordHash: 'stored' });
      passwordHasher.verify.mockResolvedValue(true);

      await service.verify('coolemailyay@example.com', 'themostsecretofallsecrets123');

      expect(usersRepository.updatePasswordHash).not.toHaveBeenCalled();
    });
  });
});
