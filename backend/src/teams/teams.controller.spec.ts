import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TeamsController } from './teams.controller.js';
import { TeamsService } from './teams.service.js';

describe('TeamsController', () => {
  let controller: TeamsController;

  const teamsServiceMock = {
    create: vi.fn(),
    addMember: vi.fn(),
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

  it('should create and return a team with a trimmed name', async () => {
    const team = {
      id: 'team-1',
      name: 'Test Team',
      createdAt: new Date(),
    };

    teamsServiceMock.create.mockResolvedValue(team);

    await expect(
      controller.create({
        name: '  Test Team  ',
      }),
    ).resolves.toEqual(team);

    expect(teamsServiceMock.create).toHaveBeenCalledWith('Test Team');
  });

  it('should reject an empty team name', () => {
    expect(() =>
      controller.create({
        name: ' ',
      }),
    ).toThrow(BadRequestException);
  });

  it('should reject an invalid user ID', () => {
    expect(() =>
      controller.addMember('team-1', {
        userId: 0,
      }),
    ).toThrow(BadRequestException);
  });

});
