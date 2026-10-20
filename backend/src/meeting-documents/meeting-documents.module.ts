import { Module } from '@nestjs/common';
import { MeetingDocumentsController } from './meeting-documents.controller.js';
import { MeetingDocumentsService } from './meeting-documents.service.js';

@Module({
  controllers: [MeetingDocumentsController],
  providers: [MeetingDocumentsService],
  exports: [MeetingDocumentsService],
})
export class MeetingDocumentsModule {}