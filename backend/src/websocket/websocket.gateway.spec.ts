import { WebsocketGateway } from './websocket.gateway.js';

describe('WebsocketGateway', () => {
	const participants = {
		findMany: vi.fn(),
		findFirst: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		deleteMany: vi.fn()
	};
	const users = { findUnique: vi.fn() };
	const event = { findUnique: vi.fn() };
	const documents = {
		findForEvent: vi.fn(),
		updateSection: vi.fn(),
	};
	const teamMember = { findMany: vi.fn() };
	const eventsService = { canAccess: vi.fn() };
	const server = { to: vi.fn() };
	const room = { emit: vi.fn() };
	const eventId = 'event-1';
	const participantName = 'Ada';
	const cells = ['Oct 2-09:00'];
	let gateway: WebsocketGateway; // Test setup assigns the gateway before each case.

	function createClient(data: Record<string, unknown> = {}) {
		return { data } as never;
	}

	beforeEach(() => {
		vi.clearAllMocks();
		event.findUnique.mockResolvedValue({ id: eventId, teamId: null });
		eventsService.canAccess.mockResolvedValue(true);
		server.to.mockReturnValue(room);
		gateway = new WebsocketGateway(
			{ event, participant: participants, user: users, teamMember } as never,
			{ authenticateConnection: vi.fn() } as never,
			documents as never,
			eventsService as never
		);
		gateway.server = server as never;
	});

	// Watching an event returns its saved availability.
	it('loads saved availability for a watched event', async () => {
		const emit = vi.fn();
		const join = vi.fn();
		const client = { data: { userId: 1 }, join, emit } as never;
		participants.findMany.mockResolvedValue([
			{ name: participantName, availability: ['2026-10-02 09:00'], user: { email: 'ada@example.com' } }
		]);

		await gateway.onWatch(eventId, client);

		expect(join).toHaveBeenCalledWith(eventId);
		expect(emit).toHaveBeenCalledWith('participants', {
			'ada@example.com': ['2026-10-02 09:00']
		});
	});

	it('ignores unknown events', async () => {
		const join = vi.fn();
		const emit = vi.fn();
		const client = { data: { userId: 1 }, join, emit } as never;
		event.findUnique.mockResolvedValue(null);

		await gateway.onWatch(eventId, client);

		expect(join).not.toHaveBeenCalled();
		expect(emit).not.toHaveBeenCalled();
	});

	it('rejects watchers outside the event team', async () => {
		const data: Record<string, unknown> = { userId: 5, eventId: 'other-event' };
		const join = vi.fn();
		const emit = vi.fn();
		event.findUnique.mockResolvedValue({ id: eventId, teamId: 'team-1' });
		eventsService.canAccess.mockResolvedValue(false);

		await gateway.onWatch(eventId, { data, join, emit } as never);

		expect(join).not.toHaveBeenCalled();
		expect(emit).toHaveBeenCalledWith('error', "Not a member of this event's team");
		expect(data.eventId).toBeUndefined();
	});

	it('lists team members without responses as having no availability', async () => {
		const emit = vi.fn();
		event.findUnique.mockResolvedValue({ id: eventId, teamId: 'team-1' });
		participants.findMany.mockResolvedValue([
			{ name: 'ada@example.com', availability: cells, user: { email: 'ada@example.com' } }
		]);
		teamMember.findMany.mockResolvedValue([
			{ user: { email: 'ada@example.com' } },
			{ user: { email: 'bea@example.com' } }
		]);

		await gateway.onWatch(eventId, { data: { userId: 1 }, join: vi.fn(), emit } as never);

		expect(emit).toHaveBeenCalledWith('participants', {
			'ada@example.com': cells,
			'bea@example.com': []
		});
	});

	// Updating availability saves and broadcasts the new cells.
	it('saves changed availability and broadcasts it to the event room', async () => {
		const client = createClient({ eventId, userId: 1 });
		participants.findFirst.mockResolvedValue({ id: 3 });
		users.findUnique.mockResolvedValue({ id: 1, email: 'ada@example.com' });
		participants.findMany.mockResolvedValue([{ name: 'ada@example.com', availability: cells, user: { email: 'ada@example.com' } }]);

		await gateway.onUpdate(cells, client);

		expect(participants.update).toHaveBeenCalledWith({
			where: { id: 3 },
			data: { availability: cells }
		});
		expect(server.to).toHaveBeenCalledWith(eventId);
		expect(room.emit).toHaveBeenCalledWith('participants', { 'ada@example.com': cells });
	});

	it('keeps responses from people outside the team, like guests on a public event', async () => {
		const emit = vi.fn();
		event.findUnique.mockResolvedValue({ id: eventId, teamId: 'team-1' });
		participants.findMany.mockResolvedValue([
			{ name: 'ada@example.com', availability: cells, user: { email: 'ada@example.com' } },
			{ name: 'cy@example.com', availability: cells, user: { email: 'cy@example.com' } }
		]);
		teamMember.findMany.mockResolvedValue([
			{ user: { email: 'ada@example.com' } },
			{ user: { email: 'bea@example.com' } }
		]);

		await gateway.onWatch(eventId, { data: { userId: 1 }, join: vi.fn(), emit } as never);

		expect(emit).toHaveBeenCalledWith('participants', {
			'ada@example.com': cells,
			'bea@example.com': [],
			'cy@example.com': cells
		});
	});

	// Joining an event saves the participant's initial availability.
	it('saves availability when a participant joins', async () => {
		const client = createClient({ eventId, userId: 1 });
		users.findUnique.mockResolvedValue({ id: 1, email: 'ada@example.com' });
		participants.findFirst.mockResolvedValue(null);
		participants.findMany.mockResolvedValue([{ name: 'ada@example.com', availability: cells, user: { email: 'ada@example.com' } }]);

		await gateway.onJoin({ availability: cells }, client);

		expect(participants.create).toHaveBeenCalledWith({
			data: { eventId, userId: 1, name: 'ada@example.com', availability: cells }
		});
		expect(room.emit).toHaveBeenCalledWith('participants', { 'ada@example.com': cells });
	});

	it('allows another account to submit separate availability', async () => {
		const client = createClient({ eventId, userId: 2 });
		users.findUnique.mockResolvedValue({ id: 2, email: 'bea@example.com' });
		participants.findFirst.mockResolvedValue(null);
		participants.findMany.mockResolvedValue([]);

		await gateway.onJoin({ availability: cells }, client);

		expect(participants.create).toHaveBeenCalledWith({
			data: { eventId, userId: 2, name: 'bea@example.com', availability: cells }
		});
	});

	it('removes a participant when they leave', async () => {
		const client = createClient({ eventId, userId: 1 });
		participants.deleteMany.mockResolvedValue({ count: 1 });
		participants.findMany.mockResolvedValue([]);

		await gateway.onLeave(client);

		expect(participants.deleteMany).toHaveBeenCalledWith({
			where: { eventId, userId: 1 }
		});
		expect(room.emit).toHaveBeenCalledWith('participants', {});
	});

	it('ignores malformed availability cells', async () => {
		const client = createClient({ eventId });

		await gateway.onJoin({ availability: ['invalid'] }, client);

		expect(participants.create).not.toHaveBeenCalled();
	});

	it('reports database errors to the client', async () => {
		const emit = vi.fn();
		const client = { data: {}, join: vi.fn(), emit } as never;
		event.findUnique.mockRejectedValue(new Error('database failed'));

		await gateway.onWatch(eventId, client);

		expect(emit).toHaveBeenCalledWith('error', 'Unable to load event');
	});

	it('sends the document to a viewer', async () => {
		const document = { agenda: 'Plan demo', notes: '', updatedAt: null };
		const join = vi.fn();
		const emit = vi.fn();
		const client = { data: { userId: 1 }, join, emit } as never;

		documents.findForEvent.mockResolvedValue(document);

		await gateway.onWatchDocument(eventId, client);

		expect(documents.findForEvent).toHaveBeenCalledWith(eventId, 1);
		expect(join).toHaveBeenCalledWith(`document:${eventId}`);
		expect(emit).toHaveBeenCalledWith('meeting-document', document);
	});

	it('rejects an invalid section', async () => {
		const emit = vi.fn();
		const client = {
			data: { userId: 1, documentEventId: eventId },
			emit,
		} as never;

		await gateway.onUpdateDocumentSection(
			{ section: 'other', content: 'Text' } as never,
			client,
		);

		expect(documents.updateSection).not.toHaveBeenCalled();
		expect(emit).toHaveBeenCalledWith(
			'document-error',
			'Invalid document update',
		);
	});
	
	it('saves an edit and sends it to other viewers', async () => {
		const emit = vi.fn();
		const broadcast = vi.fn();
		const to = vi.fn().mockReturnValue({ emit: broadcast });
		const client = {data: { userId: 1, documentEventId: eventId }, emit, to} as never;

		documents.updateSection.mockResolvedValue({
			updatedAt: new Date('2026-10-19T12:00:00.000Z'),
		});

		await gateway.onUpdateDocumentSection(
			{ section: 'agenda', content: 'Plan demo' },
			client,
		);

		expect(documents.updateSection).toHaveBeenCalledWith(
			eventId,
			1,
			'agenda',
			'Plan demo',
		);
		expect(emit).toHaveBeenCalledWith(
			'document-saved',
			expect.objectContaining({ section: 'agenda', content: 'Plan demo' }),
		);
		expect(to).toHaveBeenCalledWith(`document:${eventId}`);
		expect(broadcast).toHaveBeenCalledWith(
			'document-section-updated',
			expect.objectContaining({ section: 'agenda', content: 'Plan demo' }),
		);
	});
});
