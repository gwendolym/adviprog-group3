import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
} from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { User } from '../generated/prisma/client.js';
import { UsersService } from './users.service.js';

@Controller('me')
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  me(@CurrentUser() user: User) {
    return this.usersService.getCurrentUser(user.id);
  }

  @Patch()
  async update(
    @CurrentUser() user: User,
    @Body() body: { holidayCountry?: unknown },
  ) {
    const countries = [
      'AL',
      'AD',
      'AT',
      'BY',
      'BE',
      'BR',
      'BG',
      'HR',
      'CZ',
      'EE',
      'FR',
      'DE',
      'HU',
      'IE',
      'IT',
      'LV',
      'LI',
      'LT',
      'LU',
      'MT',
      'MX',
      'MD',
      'MC',
      'NL',
      'PL',
      'PT',
      'RO',
      'SM',
      'RS',
      'SK',
      'SI',
      'ZA',
      'ES',
      'SE',
      'CH',
      'VA',
      'NONE',
    ];
    if (
      typeof body?.holidayCountry !== 'string' ||
      !countries.includes(body.holidayCountry)
    ) {
      throw new BadRequestException('Unsupported holiday country');
    }
    return this.usersService.updateHolidayCountry(user.id, body.holidayCountry);
  }
}
