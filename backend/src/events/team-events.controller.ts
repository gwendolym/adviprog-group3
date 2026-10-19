import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { User } from '../generated/prisma/client.js';
import { EventsService } from './events.service.js';

@Controller('teams/:teamId/events')
export class TeamEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  getTeamEvents(@Param('teamId') teamId: string, @CurrentUser() user: User) {
    return this.eventsService.getTeamEvents(teamId, user.id);
  }
}
