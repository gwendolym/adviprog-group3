import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController; // Test setup assigns the controller before each case.
  const appService = {
    getHello: () => 'This message is from the backend!',
    createEvent: vi.fn(),
  };
  const user = { id: 3 } as never;
  const validEvent = {
    name: 'Standup',
    dates: ['2026-10-20', '2026-10-21'],
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'Europe/Stockholm',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: appService }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the backend greeting', () => {
      expect(appController.getHello()).toBe(
        'This message is from the backend!',
      );
    });
  });

  describe('createEvent', () => {
    it('creates a valid event for the signed-in user', async () => {
      appService.createEvent.mockResolvedValue({ id: 'e1' });

      await expect(appController.createEvent(validEvent, user)).resolves.toEqual({ id: 'e1' });
      expect(appService.createEvent).toHaveBeenCalledWith(validEvent, 3);
    });

    it.each([
      ['no body', undefined],
      ['a missing name', { ...validEvent, name: undefined }],
      ['dates that are not a list', { ...validEvent, dates: '2026-10-20' }],
      ['no dates', { ...validEvent, dates: [] }],
      ['an unreadable date', { ...validEvent, dates: ['2026-10-20', 'not-a-date'] }],
      ['a date that is not text', { ...validEvent, dates: [20261020] }],
      ['a missing start time', { ...validEvent, startTime: undefined }],
      ['a missing end time', { ...validEvent, endTime: 17 }],
      ['a missing timezone', { ...validEvent, timezone: null }],
    ])('rejects %s', async (_, event) => {
      await expect(appController.createEvent(event as never, user)).rejects.toBeInstanceOf(BadRequestException);
      expect(appService.createEvent).not.toHaveBeenCalled();
    });
  });
});
