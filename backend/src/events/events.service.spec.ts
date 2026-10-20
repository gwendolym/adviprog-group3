import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventsService, MEET_LINKS_PER_USER } from './events.service.js';

describe('EventsService', () => {
  const prisma = {
    event: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    teamMember: { findUnique: vi.fn() },
  };
  const input = {
    name: 'Standup',
    dates: ['2026-10-20'],
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'Europe/Stockholm',
  };
  const googleMeet = { createMeeting: vi.fn() };
  let service: EventsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EventsService(prisma as never, googleMeet as never);
    prisma.event.create.mockImplementation(({ data }) => data);
    prisma.event.count.mockResolvedValue(0);
    googleMeet.createMeeting.mockResolvedValue('https://meet.google.com/abc-defg-hij');
  });

  describe('getTeamEvents', () => {
    it('lists a team\'s events, newest first, for its members', async () => {
      const events = [
        { id: 'e1', teamId: 't1', linkAccess: false },
        { id: 'e2', teamId: 't1', linkAccess: true },
      ];
      prisma.teamMember.findUnique.mockResolvedValue({ userId: 1 });
      prisma.event.findMany.mockResolvedValue(events);

      await expect(service.getTeamEvents('t1', 1)).resolves.toEqual([
        { ...events[0], isPublic: false },
        { ...events[1], isPublic: true },
      ]);

    });

    it('rejects non-members with 403 without listing anything', async () => {
      prisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(service.getTeamEvents('t1', 2)).rejects.toThrow(ForbiddenException);
      expect(prisma.event.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getEvent', () => {
    it('throws when the event does not exist', async () => {
      prisma.event.findUnique.mockResolvedValue(null);

      await expect(service.getEvent('e1', 1)).rejects.toThrow(NotFoundException);
    });

    it('returns events without a team to any user', async () => {
      const event = { id: 'e1', teamId: null, linkAccess: false };
      prisma.event.findUnique.mockResolvedValue(event);

      await expect(service.getEvent('e1', 1)).resolves.toEqual({ ...event, isPublic: true });
    });

    it('returns team events to anyone when they allow link access', async () => {
      const event = { id: 'e1', teamId: 't1', linkAccess: true };
      prisma.event.findUnique.mockResolvedValue(event);

      await expect(service.getEvent('e1', 2)).resolves.toEqual({ ...event, isPublic: true });
    });

    it('returns team events to team members', async () => {
      const event = { id: 'e1', teamId: 't1', linkAccess: false };
      prisma.event.findUnique.mockResolvedValue(event);
      prisma.teamMember.findUnique.mockResolvedValue({ userId: 1 });

      await expect(service.getEvent('e1', 1)).resolves.toEqual({ ...event, isPublic: false });
    });

    it('rejects team events for non-members with 403', async () => {
      prisma.event.findUnique.mockResolvedValue({ id: 'e1', teamId: 't1', linkAccess: false });
      prisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(service.getEvent('e1', 2)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createEvent', () => {
    it('creates a team-less event owned by the creator', async () => {
      prisma.event.create.mockResolvedValue({ id: 'e1' });

      await service.createEvent(input, 1);

      expect(prisma.event.create).toHaveBeenCalledWith({
        data: {
          ...input,
          dates: [new Date('2026-10-20')],
          creatorId: 1,
          teamId: null,
          linkAccess: false,
          meetUrl: 'https://meet.google.com/abc-defg-hij',
        },
      });
    });

    it('adds a Meet link only while the creator is under the limit', async () => {
      prisma.event.count.mockResolvedValueOnce(MEET_LINKS_PER_USER - 1);
      await expect(service.createEvent(input, 1)).resolves.toMatchObject({
        meetUrl: 'https://meet.google.com/abc-defg-hij',
      });
      expect(prisma.event.count).toHaveBeenCalledWith({
        where: { creatorId: 1, meetUrl: { not: null } },
      });

      prisma.event.count.mockResolvedValueOnce(MEET_LINKS_PER_USER);
      googleMeet.createMeeting.mockClear();
      await expect(service.createEvent(input, 1)).resolves.toMatchObject({ meetUrl: null });
      expect(googleMeet.createMeeting).not.toHaveBeenCalled();
    });

    it('attaches the event to a team the creator belongs to', async () => {
      prisma.teamMember.findUnique.mockResolvedValue({ userId: 1 });
      prisma.event.create.mockResolvedValue({ id: 'e1' });

      await service.createEvent({ ...input, teamId: 't1' }, 1);

      expect(prisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ teamId: 't1', creatorId: 1 }),
      });
    });

    it('stores link access only for team events', async () => {
      prisma.teamMember.findUnique.mockResolvedValue({ userId: 1 });
      prisma.event.create.mockResolvedValue({ id: 'e1' });

      await service.createEvent({ ...input, teamId: 't1', linkAccess: true }, 1);
      expect(prisma.event.create).toHaveBeenLastCalledWith({
        data: expect.objectContaining({ teamId: 't1', linkAccess: true }),
      });

      await service.createEvent({ ...input, linkAccess: true }, 1);
      expect(prisma.event.create).toHaveBeenLastCalledWith({
        data: expect.objectContaining({ teamId: null, linkAccess: false }),
      });
    });

    it('rejects creating an event for a team the user is not in', async () => {
      prisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(
        service.createEvent({ ...input, teamId: 't1' }, 2),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.event.create).not.toHaveBeenCalled();
    });
  });
});
