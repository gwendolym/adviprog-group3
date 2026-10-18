import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  getCurrentUser(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, holidayCountry: true },
    });
  }

  async updateHolidayCountry(id: number, holidayCountry: string) {
    return this.prisma.user.update({
      where: { id },
      data: { holidayCountry },
      select: { id: true, email: true, name: true, holidayCountry: true },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} was not found`);
    }
    return user;
  }
}
