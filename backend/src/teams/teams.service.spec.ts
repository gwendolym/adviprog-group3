import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { TeamsService } from './teams.service.js';

describe('TeamsService', () => {
  let service: TeamsService;

  const prismaMock = {
    team: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    teamMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a team', async () => {
    const team = {
      id: 'team-1',
      name: 'Project Team',
      createdAt: new Date(),
    };

    prismaMock.team.create.mockResolvedValue(team);

    await expect(service.create('Project Team')).resolves.toEqual(team);

    expect(prismaMock.team.create).toHaveBeenCalledWith({
      data: {
        name: 'Project Team',
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });
  });

  it('should return a team and its members', async () => {
    const team = {
      id: 'team-1',
      name: 'Project Team',
      createdAt: new Date(),
      members: [
        {
          joinedAt: new Date(),
          user: {
            id: 1,
            name: 'test',
            email: 'test@example.com',
          },
        },
      ],
    };

    prismaMock.team.findUnique.mockResolvedValue(team);

    await expect(service.findOne('team-1')).resolves.toEqual(team);

    expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'team-1',
      },
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
  });

  it('should throw an error when the team does not exist', async () => {
    prismaMock.team.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing-team')).rejects.toThrow(
      'Team with ID missing-team not found',
    );
  });

  it('should add a user to a team', async () => {
    const membership = {
      joinedAt: new Date(),
      user: {
        id: 1,
        name: 'test',
        email: 'test@example.com',
      },
    };

    prismaMock.team.findUnique.mockResolvedValue({
      id: 'team-1',
    });

    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
    });

    prismaMock.teamMember.findUnique.mockResolvedValue(null);
    prismaMock.teamMember.create.mockResolvedValue(membership);

    await expect(service.addMember('team-1', 1)).resolves.toEqual(membership);

    expect(prismaMock.teamMember.create).toHaveBeenCalledWith({
      data: {
        teamId: 'team-1',
        userId: 1,
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
  });

  it('should reject a user who is already a team member', async () => {
    prismaMock.team.findUnique.mockResolvedValue({
      id: 'team-1',
    });

    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
    });

    prismaMock.teamMember.findUnique.mockResolvedValue({
      teamId: 'team-1',
    });

    await expect(service.addMember('team-1', 1)).rejects.toThrow(
      'User with ID 1 is already a member of team with ID team-1',
    );

    expect(prismaMock.teamMember.create).not.toHaveBeenCalled();
  });

  it('should remove a user from a team', async () => {
    prismaMock.teamMember.findUnique.mockResolvedValue({
      teamId: 'team-1',
    });

    prismaMock.teamMember.delete.mockResolvedValue({
      teamId: 'team-1',
      userId: 1,
      joinedAt: new Date(),
    });

    await expect(service.removeMember('team-1', 1)).resolves.toBeUndefined();

    expect(prismaMock.teamMember.delete).toHaveBeenCalledWith({
      where: {
        teamId_userId: {
          teamId: 'team-1',
          userId: 1,
        },
      },
    });
  });

  it('should reject removing a user who is not a team member', async () => {
    prismaMock.teamMember.findUnique.mockResolvedValue(null);

    await expect(service.removeMember('team-1', 1)).rejects.toThrow(
      'User with ID 1 is not a member of team with ID team-1',
    );

    expect(prismaMock.teamMember.delete).not.toHaveBeenCalled();
  });
});
