import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';

describe('AppService', () => {
  let service: AppService;

  const prismaMock = {
    event: {
      findMany: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should return events created by or participated in by the user', async () => {
    const events = [
      {
        id: 'event-1',
        name: 'Project meeting',
      },
    ];

    prismaMock.event.findMany.mockResolvedValue(events);

    await expect(service.getEvents(1)).resolves.toEqual(events);

    expect(prismaMock.event.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            creatorId: 1,
          },
          {
            participants: {
              some: {
                userId: 1,
              },
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });
});