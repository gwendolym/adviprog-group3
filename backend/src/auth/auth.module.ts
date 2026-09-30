
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { SessionAuth } from './session-auth.providers.js';
import { AuthController } from './auth.controller.js';
import { CredentialsService } from './credentials.service.js';
import { EmailVerificationMailer } from './email-verification.mailer.js';
import { EmailVerificationController } from './email-verification.controller.js';
import { PasswordResetMailer } from './password-reset.mailer.js';
import { PasswordResetController } from './password-reset.controller.js';
@Module({
  imports: [UsersModule],
  controllers: [
    AuthController, 
    EmailVerificationController, 
    PasswordResetController,
  ],
  providers: [
    SessionAuth, 
    CredentialsService, 
    EmailVerificationMailer,  
    PasswordResetMailer,
  ],
})
export class AuthModule {}
