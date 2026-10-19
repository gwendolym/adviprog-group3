import { MeetingDocumentsService } from './meeting-documents.service.js';

describe('MeetingDocumentsService', () => {
  const prisma = {
    event: {
      findFirst: vi.fn(),
    },
    meetingDocument: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  };

  const service = new MeetingDocumentsService(prisma as never);

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.event.findFirst.mockResolvedValue({ id: 'event-1' });
  });

  it('returns empty sections before a document is saved', async () => {
    prisma.meetingDocument.findUnique.mockResolvedValue(null);
    
    await expect(service.findForEvent('event-1', 1)).resolves.toEqual({
      agenda: '',
      notes: '',
      updatedAt: null,
    });
  });

  it('updates only the chosen section', async () => {
    const updated = {
      agenda: 'meeting time',
      notes: '',
      updatedAt: new Date(),
    };

    prisma.meetingDocument.upsert.mockResolvedValue(updated);

    await expect(
      service.updateSection('event-1', 1, 'agenda', 'meeting time'),
    ).resolves.toEqual(updated);

    expect(prisma.meetingDocument.upsert).toHaveBeenCalledWith({
      where: { eventId: 'event-1' },
      create: {
        eventId: 'event-1',
        agenda: 'meeting time',
        notes: '',
        updatedById: 1,
      },
      update: {
        agenda: 'meeting time',
        updatedById: 1,
      },
      select: {
        agenda: true,
        notes: true,
        updatedAt: true,
      },
    });
  });

  it('rejects a user without access to the event', async () => {
    prisma.event.findFirst.mockResolvedValue(null);

    await expect(service.findForEvent('event-1', 2)).rejects.toThrow(
      'Event not found or inaccessible',
    );

    expect(prisma.meetingDocument.findUnique).not.toHaveBeenCalled();
  });
});