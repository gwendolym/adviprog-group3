
import { google, type OidcOptions } from '@nestjs/authentication';

export const googleOAuthEnabled = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export function oidcOptions(appUrl: string): OidcOptions | undefined {
  if (!googleOAuthEnabled()) {
    return undefined;
  }
  return {
    callbackUrl: `${appUrl}/api/auth/oidc/:provider/callback`,
    providers: {
      google: google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    },
    redirectAfterLogin: '/event',
  };
}
