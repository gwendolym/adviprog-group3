import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TeamsController } from './teams.controller.js';
import { TeamsService } from './teams.service.js';

describe('TeamsController', () => {
  let controller: TeamsController;

  const currentUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    roles: [],
  };

  const teamsServiceMock = {
    create: vi.fn(),
    addMember: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    removeMember: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        {
          provide: TeamsService,
          useValue: teamsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a team and use the current user as creator', async () => {
    const team = {
      id: 'team-1',
      name: 'Test Team',
      createdAt: new Date(),
      members: [],
    };

    teamsServiceMock.create.mockResolvedValue(team);

    await expect(
      controller.create(
        {
          name: ' Test Team ',
        },
        currentUser,
      ),
    ).resolves.toEqual(team);

    expect(teamsServiceMock.create).toHaveBeenCalledWith('Test Team', 1);
  });

  it('should reject an empty team name', () => {
    expect(() =>
      controller.create(
        {
          name: ' ',
        },
        currentUser,
      ),
    ).toThrow(BadRequestException);
  });

  it('should list teams for the current user', async () => {
    const teams = [
      {
        id: 'team-1',
        name: 'Test Team',
        createdAt: new Date(),
        _count: {
          members: 1,
        },
      },
    ];

    teamsServiceMock.findAll.mockResolvedValue(teams);
    await expect(controller.findAll(currentUser)).resolves.toEqual(teams);
    expect(teamsServiceMock.findAll).toHaveBeenCalledWith(1);
  });

  it('should join a team as the current user', async () => {
    const membership = {
      joinedAt: new Date(),
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    teamsServiceMock.addMember.mockResolvedValue(membership);

    await expect(controller.join('team-1', currentUser)).resolves.toEqual(
      membership,
    );

    expect(teamsServiceMock.addMember).toHaveBeenCalledWith('team-1', 1);
  });

  it('should leave a team as the current user', async () => {
    teamsServiceMock.removeMember.mockResolvedValue(undefined);

    await expect(
      controller.leave('team-1', currentUser),
    ).resolves.toBeUndefined();

    expect(teamsServiceMock.removeMember).toHaveBeenCalledWith('team-1', 1);
  });

  it('should reject a team name longer than 50 characters', () => {
    expect(() =>
      controller.create(
        {
          name: 'a'.repeat(51),
        },
        currentUser,
      ),
    ).toThrow('Team name must be at most 50 characters');

    expect(teamsServiceMock.create).not.toHaveBeenCalled();
  });
});
