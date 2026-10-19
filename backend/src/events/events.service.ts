import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { GoogleMeetService } from '../google/google-meet.service.js';

export const MEET_LINKS_PER_USER = 5;

const withTeam = { team: { select: { id: true, name: true } } } as const;
const withCreator = { creator: { select: { id: true, name: true, email: true } } } as const;

export interface CreateEventInput {
  name: string;
  dates: string[];
  startTime: string;
  endTime: string;
  timezone: string;
  teamId?: string;
}

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly googleMeet: GoogleMeetService,
  ) {}

  getEvents(userId: number) {
    return this.prisma.event.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { participants: { some: { userId } } },
          { team: { members: { some: { userId } } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: withTeam,
    });
  }

  async getEvent(id: string, userId: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { ...withTeam, ...withCreator },
    });
    if (!event) throw new NotFoundException('Event not found'); // Sends 404 response if event is not found
    if (!(await this.canAccess(event, userId))) {
      throw new ForbiddenException("You are not a member of this event's team");
    }
    return event;
  }

  async createEvent(input: CreateEventInput, userId: number) {
    const { teamId, dates, ...rest } = input;
    if (teamId) await this.assertTeamMember(teamId, userId);

    return this.prisma.event.create({
      data: {
        ...rest,
        dates: dates.map((date) => new Date(date)),
        creatorId: userId,
        teamId: teamId ?? null,
        meetUrl: await this.createMeetingFor(userId),
      },
    });
  }

  private async createMeetingFor(creatorId: number): Promise<string | null> {
    const used = await this.prisma.event.count({ where: { creatorId, meetUrl: { not: null } } });
    return used < MEET_LINKS_PER_USER ? this.googleMeet.createMeeting() : null;
  }

  async canAccess(event: { teamId: string | null }, userId: number) {
    if (!event.teamId) return true;
    return this.isTeamMember(event.teamId, userId);
  }

  private async assertTeamMember(teamId: string, userId: number) {
    if (!(await this.isTeamMember(teamId, userId))) {
      throw new ForbiddenException('You are not a member of this team');
    }
  }

  private async isTeamMember(teamId: string, userId: number) {
    const membership = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
      select: { userId: true },
    });
    return membership !== null;
  }
}
