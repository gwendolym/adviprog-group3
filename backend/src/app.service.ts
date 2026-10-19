import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';
import { GoogleMeetService } from './google/google-meet.service.js';

export const MEET_LINKS_PER_USER = 5;

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly googleMeet: GoogleMeetService,
  ) {}

  getHello(): string {
    return 'This message is from the backend!';
  }

  async getEvent(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found'); // Sends 404 response if event is not found
    return event;
  }

  getEvents(userId: number) {
    return this.prisma.event.findMany({
      where: {
        OR: [
          { creatorId: userId },
          {
            participants: {
              some: { userId: userId },
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createEvent(event: {
    name: string;
    dates: string[];
    startTime: string;
    endTime: string;
    timezone: string;
  }, creatorId: number) {
    return this.prisma.event.create({
      data: {
        ...event,
        dates: event.dates.map((date) => new Date(date)),
        creatorId,
        meetUrl: await this.createMeetingFor(creatorId),
      },
    });
  }

  private async createMeetingFor(creatorId: number): Promise<string | null> {
    const used = await this.prisma.event.count({ where: { creatorId, meetUrl: { not: null } } });
    return used < MEET_LINKS_PER_USER ? this.googleMeet.createMeeting() : null;
  }
}
