import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { User } from '../generated/prisma/client.js';
import { EventsService, type CreateEventInput } from './events.service.js';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  getEvents(@CurrentUser() user: User) {
    return this.eventsService.getEvents(user.id);
  }

  @Get(':id')
  getEvent(@Param('id') id: string, @CurrentUser() user: User) {
    return this.eventsService.getEvent(id, user.id);
  }

  @Post()
  async createEvent(@Body() event: CreateEventInput, @CurrentUser() user: User) {
    if (
      typeof event?.name !== 'string' ||
      !Array.isArray(event.dates) ||
      event.dates.length === 0 ||
      event.dates.some(
        (date) => typeof date !== 'string' || Number.isNaN(Date.parse(date)),
      ) ||
      typeof event.startTime !== 'string' ||
      typeof event.endTime !== 'string' ||
      typeof event.timezone !== 'string' ||
      (event.teamId !== undefined && typeof event.teamId !== 'string') ||
      (event.linkAccess !== undefined && typeof event.linkAccess !== 'boolean')
    ) {
      throw new BadRequestException('Invalid event data');
    }

    return this.eventsService.createEvent(event, user.id);
  }
}
