import { AppService, MEET_LINKS_PER_USER } from './app.service.js';

describe('AppService', () => {
  const prisma = { event: { count: vi.fn(), create: vi.fn() } };
  const googleMeet = { createMeeting: vi.fn() };
  const service = new AppService(prisma as never, googleMeet as never);
  const event = { name: 'Standup', dates: ['2026-10-20'], startTime: '09:00', endTime: '10:00', timezone: 'Europe/Stockholm' };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.event.create.mockImplementation(({ data }) => data);
    googleMeet.createMeeting.mockResolvedValue('https://meet.google.com/abc-defg-hij');
  });

  it('adds a Meet link while the user is under the limit', async () => {
    prisma.event.count.mockResolvedValue(MEET_LINKS_PER_USER - 1);

    await expect(service.createEvent(event, 7)).resolves.toMatchObject({ meetUrl: 'https://meet.google.com/abc-defg-hij' });
    expect(prisma.event.count).toHaveBeenCalledWith({ where: { creatorId: 7, meetUrl: { not: null } } });
  });

  it('creates the event without a Meet link once the limit is reached', async () => {
    prisma.event.count.mockResolvedValue(MEET_LINKS_PER_USER);

    await expect(service.createEvent(event, 7)).resolves.toMatchObject({ name: 'Standup', meetUrl: null });
    expect(googleMeet.createMeeting).not.toHaveBeenCalled();
  });
});
