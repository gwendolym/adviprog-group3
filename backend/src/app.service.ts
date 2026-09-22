import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'This message is from the backend!';
  }

  async getUsers() {
    const users = await this.prisma.user.findMany();
    return users.length > 0 ? users : 'No users';
  }
}
