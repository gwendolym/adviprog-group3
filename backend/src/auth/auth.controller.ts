
import { Body, Controller, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { EmailVerificationService, Public, SignInService } from '@nestjs/authentication';
import { SignInDto, SignUpDto } from './auth.dto.js';
import { CredentialsService } from './credentials.service.js';

@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly credentialsService: CredentialsService,
    private readonly signInService: SignInService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('sign-up')
    async signUp(@Body() body: SignUpDto) {
    const user = await this.credentialsService.register(body.email, body.password);
    await this.signInService.signIn(String(user.id), { method: 'password' });
    await this.emailVerificationService.send({ id: String(user.id), email: user.email });
    return user;
  }

  
  @Post('sign-in')
  @HttpCode(200)
  async signIn(@Body() body: SignInDto) {
    const user = await this.credentialsService.verify(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const { session } = await this.signInService.signIn(String(user.id), { method: 'password' });
    return { mfaRequired: session.mfa === 'pending' };
  }

  @Post('sign-out')
  @HttpCode(204)
  async signOut() {
    await this.signInService.signOut();
  }
}
