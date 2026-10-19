
import { Controller, Get, Logger, NotFoundException, Param, Query, Redirect } from '@nestjs/common';
import { OidcService, Public } from '@nestjs/authentication';
import { googleOAuthEnabled } from './oidc.config.js';

@Public()
@Controller('auth/oidc')
export class OidcController {
  private readonly logger = new Logger(OidcController.name);

  constructor(private readonly oidc: OidcService) {}

  @Get(':provider/login')
  @Redirect()
  login(@Param('provider') provider: string, @Query('redirectTo') redirectTo?: string) {
    if (!googleOAuthEnabled()) {
      throw new NotFoundException('Sign-in provider not configured');
    }
    return this.oidc.start(provider, { redirectTo });
  }

  @Get(':provider/callback')
  @Redirect()
  async callback(@Param('provider') provider: string, @Query() query: Record<string, string>) {
    try {
      return await this.oidc.finish(provider, query);
    } catch (error) {
      this.logger.warn(`${provider} sign-in failed: ${error instanceof Error ? error.message : error}`);
      return { url: `/login?error=${encodeURIComponent(provider)}` };
    }
  }
}
