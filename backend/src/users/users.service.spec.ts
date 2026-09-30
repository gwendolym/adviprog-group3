import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let usersService: UsersService;

  const prismaMock = {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  it('should return all users', async () => {
    const users = [
      {
        id: 1,
        email: 'test@testing.com',
        name: 'test',
      },
    ];

    prismaMock.user.findMany.mockResolvedValue(users);

    expect(await usersService.findAll()).toEqual(users);
    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  });

  it('should return one user', async () => {
    const user = {
      id: 1,
      email: 'test@testing.com',
      name: 'test',
    };

    prismaMock.user.findUnique.mockResolvedValue(user);

    expect(await usersService.findOne(1)).toEqual(user);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  });

  it('should throw an error when the user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(usersService.findOne(1)).rejects.toThrow(
      'User with ID 1 was not found',
    );
  });
});
