import { Test} from '@nestjs/testing';
import { MeetingDocumentsController } from './meeting-documents.controller.js';
import { MeetingDocumentsService } from './meeting-documents.service.js';

describe('MeetingDocumentsController', () => {
  let controller: MeetingDocumentsController;

  const documentsMock = {
    findForEvent: vi.fn(),
    updateSection: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [MeetingDocumentsController],
      providers: [
        {
          provide: MeetingDocumentsService,
          useValue: documentsMock,
        },
      ],
    }).compile();

    controller = module.get(MeetingDocumentsController);
  });

  it('passes the event and user IDs when loading', () => {
    controller.findForEvent('event-1', { id: 1 } as never);
    expect(documentsMock.findForEvent).toHaveBeenCalledWith('event-1', 1);
  });

  it('passes the update to the service', () => {
    controller.updateSection('event-1', {section: 'agenda', content: 'meeting time' },{id: 1 } as never);
    expect(documentsMock.updateSection).toHaveBeenCalledWith('event-1', 1, 'agenda', 'meeting time');
  });
});
