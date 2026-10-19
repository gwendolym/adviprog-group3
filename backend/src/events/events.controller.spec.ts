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

  it('passes the current user and team when creating an event', async () => {
    await controller.createEvent({ ...valid, teamId: 't1' }, user);

    expect(eventsService.createEvent).toHaveBeenCalledWith({ ...valid, teamId: 't1' }, 1);
  });

  it.each([
    ['a non-string teamId', { ...valid, teamId: 5 }],
  ])('rejects %s', async (_label, body) => {
    await expect(controller.createEvent(body as never, user)).rejects.toThrow(
      BadRequestException,
    );
    expect(eventsService.createEvent).not.toHaveBeenCalled();
  });
});
