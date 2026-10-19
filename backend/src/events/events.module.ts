import { Module } from '@nestjs/common';
import { EventsController } from './events.controller.js';
import { TeamEventsController } from './team-events.controller.js';
import { EventsService } from './events.service.js';
import { GoogleModule } from '../google/google.module.js';

@Module({
  imports: [GoogleModule],
  controllers: [EventsController, TeamEventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
