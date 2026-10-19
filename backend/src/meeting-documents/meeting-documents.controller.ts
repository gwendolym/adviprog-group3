import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { PublicUser } from '../users/users.repository.js';
import { UpdateMeetingDocumentDto } from './meeting-document.dto.js';
import { MeetingDocumentsService } from './meeting-documents.service.js';

@Controller('events/:eventId/document')
export class MeetingDocumentsController {
  constructor(
    private readonly documents: MeetingDocumentsService,
  ) {}

  @Get()
  findForEvent(
    @Param('eventId') eventId: string,
    @CurrentUser() user: PublicUser,
  ) {
    return this.documents.findForEvent(eventId, user.id);
  }

  @Patch()
  updateSection(
    @Param('eventId') eventId: string,
    @Body() body: UpdateMeetingDocumentDto,
    @CurrentUser() user: PublicUser,
  ) {
    return this.documents.updateSection(
      eventId,
      user.id,
      body.section,
      body.content,
    );
  }
}
