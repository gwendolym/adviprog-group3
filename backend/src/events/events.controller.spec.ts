import { BadRequestException } from '@nestjs/common';
import { EventsController } from './events.controller.js';

describe('EventsController', () => {
  const eventsService = { getEvents: vi.fn(), getEvent: vi.fn(), createEvent: vi.fn() };
  const user = { id: 1 } as never;
  const valid = {
    name: 'Standup',
    dates: ['2026-10-20'],
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'Europe/Stockholm',
  };
  let controller: EventsController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new EventsController(eventsService as never);
  });

  it('creates a valid event for the signed-in user', async () => {
    eventsService.createEvent.mockResolvedValue({ id: 'e1' });

    await expect(controller.createEvent(valid, user)).resolves.toEqual({ id: 'e1' });
    expect(eventsService.createEvent).toHaveBeenCalledWith(valid, 1);
  });

  it('passes the current user and team when creating an event', async () => {
    await controller.createEvent({ ...valid, teamId: 't1' }, user);

    expect(eventsService.createEvent).toHaveBeenCalledWith({ ...valid, teamId: 't1' }, 1);
  });

  it.each([
    ['no body', undefined],
    ['a missing name', { ...valid, name: undefined }],
    ['dates that are not a list', { ...valid, dates: '2026-10-20' }],
    ['no dates', { ...valid, dates: [] }],
    ['an unreadable date', { ...valid, dates: ['2026-10-20', 'not-a-date'] }],
    ['a date that is not text', { ...valid, dates: [20261020] }],
    ['a missing start time', { ...valid, startTime: undefined }],
    ['a missing end time', { ...valid, endTime: 17 }],
    ['a missing timezone', { ...valid, timezone: null }],
    ['a non-string teamId', { ...valid, teamId: 5 }],
    ['a non-boolean linkAccess', { ...valid, teamId: 't1', linkAccess: 'yes' }],
  ])('rejects %s', async (_label, body) => {
    await expect(controller.createEvent(body as never, user)).rejects.toThrow(
      BadRequestException,
    );
    expect(eventsService.createEvent).not.toHaveBeenCalled();
  });
});
