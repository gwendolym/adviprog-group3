
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { SessionAuth } from './session-auth.providers.js';
import { AuthController } from './auth.controller.js';
import { CredentialsService } from './credentials.service.js';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [SessionAuth, CredentialsService],
})
export class AuthModule {}
