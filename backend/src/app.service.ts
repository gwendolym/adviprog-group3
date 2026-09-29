import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'This message is from the backend!';
  }

  async getUsers() {
    const users = await this.prisma.user.findMany();
    if (users.length === 0) {
      throw new NotFoundException('No users found'); // Sends 404 response if no users are found
    }
    return users;
  }

  async getEvent(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found'); // Sends 404 response if event is not found
    return event;
  }

  async createEvent(event: {
    name: string;
    dates: string[];
    startTime: string;
    endTime: string;
    timezone: string;
  }) {
    return this.prisma.event.create({
      data: {
        ...event,
        dates: event.dates.map((date) => new Date(date)),
      },
    });
  }
}
