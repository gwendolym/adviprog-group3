
import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticationRegistry, OidcAccountResolver, type OidcProfile, type OidcResolveContext } from '@nestjs/authentication';
import { UsersRepository } from '../users/users.repository.js';
import { googleOAuthEnabled } from './oidc.config.js';

@Injectable()
export class AppOidcAccountResolver extends OidcAccountResolver {
  constructor(
    private readonly usersRepository: UsersRepository,
    registry: AuthenticationRegistry,
  ) {
    super();
    if (googleOAuthEnabled()) {
      registry.registerHandler('oidc', this);
    }
  }

  async resolveUser(profile: OidcProfile, _tokens: unknown, context: OidcResolveContext) {
    const linked = await this.usersRepository.findByOAuthAccount(profile.provider, profile.subject);

    if (context.linkTo) {
      if (linked && String(linked.id) !== context.linkTo.id) {
        throw new ForbiddenException('This account is already linked to another user');
      }
      if (!linked) {
        await this.usersRepository.linkOAuthAccount(Number(context.linkTo.id), profile.provider, profile.subject);
      }
      return { id: context.linkTo.id };
    }

    if (linked) {
      return { id: String(linked.id) };
    }

    if (!profile.email || !profile.emailVerified) {
      return null;
    }

    if (await this.usersRepository.findByEmail(profile.email)) {
      const verified = await this.usersRepository.findVerifiedByEmail(profile.email);
      if (!verified) {
        return null;
      }
      await this.usersRepository.linkOAuthAccount(verified.id, profile.provider, profile.subject);
      return { id: String(verified.id) };
    }

    const created = await this.usersRepository.createWithOAuthAccount(
      profile.email,
      profile.name ?? null,
      profile.provider,
      profile.subject,
    );
    return { id: String(created.id) };
  }
}
