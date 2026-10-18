import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  create(name: string, creatorId: number) {
    return this.prisma.team.create({
      // This both creates the team and adds the creator as a member of the team
      data: {
        name: name,
        members: {
          create: {
            userId: creatorId,
          },
        },
      },
      select: {
        // What to return
        id: true,
        name: true,
        createdAt: true,
        members: {
          select: {
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // TODO: Look over which fields should be returned and which should be hidden
  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        members: {
          select: {
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }
    return team;
  }

  async addMember(teamId: string, userId: number) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const existingMembership = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      select: {
        teamId: true,
      },
    });

    if (existingMembership) {
      throw new ConflictException(
        `User with ID ${userId} is already a member of team with ID ${teamId}`,
      );
    }

    return this.prisma.teamMember.create({
      data: {
        teamId,
        userId,
      },
      select: {
        joinedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async removeMember(teamId: string, userId: number) {
    const existingMembership = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      select: {
        teamId: true,
      },
    });

    if (!existingMembership) {
      throw new NotFoundException(
        `User with ID ${userId} is not a member of team with ID ${teamId}`,
      );
    }

    await this.prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });
  }
}
