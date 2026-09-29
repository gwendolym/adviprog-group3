import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service.js';

interface CreateEventDto {
  name: string;
  dates: string[];
  startTime: string;
  endTime: string;
  timezone: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('events/:id')
  getEvent(@Param('id') id: string) {
    return this.appService.getEvent(id);
  }

  @Post('events')
  async createEvent(@Body() event: CreateEventDto) {
    if (
      typeof event?.name !== 'string' ||
      !Array.isArray(event.dates) ||
      event.dates.length === 0 ||
      event.dates.some(
        (date) => typeof date !== 'string' || Number.isNaN(Date.parse(date)),
      ) ||
      typeof event.startTime !== 'string' ||
      typeof event.endTime !== 'string' ||
      typeof event.timezone !== 'string'
    ) {
      throw new BadRequestException('Invalid event data');
    }

    return this.appService.createEvent(event);
  }
}
