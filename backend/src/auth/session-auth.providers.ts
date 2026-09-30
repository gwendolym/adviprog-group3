
import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, SessionCookieProvider, type SessionRecord } from '@nestjs/authentication';
import { UsersRepository, type PublicUser } from '../users/users.repository.js';

@Injectable()
export class SessionAuth extends SessionCookieProvider<PublicUser> {
  constructor(
    private readonly usersRepository: UsersRepository,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerProvider(this);
  }

  async validate(session: SessionRecord): Promise<PublicUser | null> {
    const userId = Number(session.userId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return null;
    }

    return this.usersRepository.findById(userId);
  }
}