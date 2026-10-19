import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { MeetingDocumentSection } from './meeting-document.dto.js';

@Injectable()
export class MeetingDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findForEvent(eventId: string, userId: number) {
    // make sure user is part of event
    await this.requireAccess(eventId, userId);

    // get the event document
    const document = await this.prisma.meetingDocument.findUnique({
      where: { eventId },
      select: {
        agenda: true,
        notes: true,
        updatedAt: true,
      },
    });

    return document ?? {
      agenda: '',
      notes: '',
      updatedAt: null,
    };
  }

  async updateSection(
    eventId: string,
    userId: number,
    section: MeetingDocumentSection,
    content: string,
  ) {

    // make sure user is part of event
    await this.requireAccess(eventId, userId);

    let data;
    if (section === 'agenda') {
        data = {
            agenda: content,
            updatedById: userId,
        };
    } else {
        data = {
            notes: content,
            updatedById: userId,
        };
    }

    return this.prisma.meetingDocument.upsert({
    where: { eventId },
        create: {
            eventId: eventId,
            agenda: section === 'agenda' ? content : '',
            notes: section === 'notes' ? content : '',
            updatedById: userId,
        },
        update: data,
    select: {
        agenda: true,
        notes: true,
        updatedAt: true,
    },
    });
  }

  private async requireAccess(eventId: string, userId: number) {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        OR: [
          { creatorId: userId },
          { participants: { some: { userId } } },
        ],
      },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found or inaccessible');
    }
  }
}