
import { Injectable } from '@nestjs/common';
import { Roles, type User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type PublicUser = Pick<User, 'id' | 'email' | 'name' | 'roles'>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    email: string,
    { passwordHash = null }: { passwordHash?: string | null } = {},
  ): Promise<PublicUser> {
    const row = await this.prisma.user.create({
      data: { email: normalize(email), passwordHash, roles: [Roles.MEMBER] },
    });
    return toUser(row);
  }

  async findById(id: number): Promise<PublicUser | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toUser(row) : null;
  }

  async findByEmail(email: string): Promise<PublicUser | null> {
    const row = await this.findRow(email);
    return row ? toUser(row) : null;
  }

  /** For password sign-in only. */
  async findCredentials(email: string): Promise<{ user: PublicUser; passwordHash: string | null } | null> {
    const row = await this.findRow(email);
    return row ? { user: toUser(row), passwordHash: row.passwordHash } : null;
  }

  async updatePasswordHash(id: number, passwordHash: string): Promise<void> {
    await this.prisma.user.updateMany({ where: { id }, data: { passwordHash } });
  }

  async updateEmail(id: number, email: string): Promise<PublicUser | null> {
    const result = await this.prisma.user.updateMany({
      where: { id },
      data: { email: normalize(email) },
    });
    return result.count ? this.findById(id) : null;
  }

  private findRow(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: normalize(email) } });
  }
}

// As the package passes addresses to handlers: an accent typed as two code points matches the stored one.
const normalize = (email: string) => email.trim().normalize('NFC').toLowerCase();
const toUser = ({ id, email, name, roles }: User): PublicUser => ({ id, email, name, roles: [...roles] });
