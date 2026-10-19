import { FileTemplateEngine, LogMailTransport, MailModule, SmtpTransport } from '@nestjs/mail';
import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { TeamsModule } from './teams/teams.module.js';
import { WebsocketGateway } from './websocket/websocket.gateway.js';
import { AuthenticationModule, WsAuthenticator } from '@nestjs/authentication';
import { AuthModule } from './auth/auth.module.js';
import { GoogleModule } from './google/google.module.js';
import { oidcOptions } from './auth/oidc.config.js';

const appUrl = process.env.APP_URL ?? process.env.ORIGIN ?? 'http://localhost:5173';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    TeamsModule,
    MailModule.forRootAsync({
      useFactory: () => ({
        transport: process.env.SMTP_URL ? new SmtpTransport({ url: process.env.SMTP_URL }) : new LogMailTransport(),
        templates: new FileTemplateEngine({ dir: join(import.meta.dirname, 'mail/templates') }),
        from: 'Meetly Account <accounts@meetly.veit.se>',
      }),
    }),
    AuthenticationModule.forRootAsync({
      useFactory: () => ({
        allowInMemoryStorage: true,
        session: {
          absoluteTtl: '14d',
          idleTtl: '3d',
          trustedOrigins: [appUrl],
        },
        emailVerification: { url: `${appUrl}/verify-email` },
        passwordReset: { url: `${appUrl}/reset-password` },
        oidc: oidcOptions(appUrl),
      }),
    }),
    AuthModule,
    GoogleModule,
  ],
  controllers: [AppController],
  providers: [AppService, WebsocketGateway, WsAuthenticator],
})
export class AppModule {}
