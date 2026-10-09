import { WebsocketGateway } from './websocket.gateway.js';

describe('WebsocketGateway', () => {
	const participants = {
		findMany: vi.fn(),
		upsert: vi.fn()
	};
	const event = { findUnique: vi.fn() };
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
		event.findUnique.mockResolvedValue({ id: eventId });
		server.to.mockReturnValue(room);
		gateway = new WebsocketGateway({ event, participant: participants } as never);
		gateway.server = server as never;
	});

	// Watching an event returns its saved availability.
	it('loads saved availability for a watched event', async () => {
		const emit = vi.fn();
		const join = vi.fn();
		const client = { data: {}, join, emit } as never;
		participants.findMany.mockResolvedValue([
			{ name: participantName, availability: ['2026-10-02 09:00'] }
		]);

		await gateway.onWatch(eventId, client);

		expect(join).toHaveBeenCalledWith(eventId);
		expect(emit).toHaveBeenCalledWith('participants', {
			[participantName]: ['2026-10-02 09:00']
		});
	});

	it('ignores unknown events', async () => {
		const join = vi.fn();
		const emit = vi.fn();
		const client = { data: {}, join, emit } as never;
		event.findUnique.mockResolvedValue(null);

		await gateway.onWatch(eventId, client);

		expect(join).not.toHaveBeenCalled();
		expect(emit).not.toHaveBeenCalled();
	});

	// Updating availability saves and broadcasts the new cells.
	it('saves changed availability and broadcasts it to the event room', async () => {
		const client = createClient({ eventId, name: participantName });
		participants.upsert.mockResolvedValue({});
		participants.findMany.mockResolvedValue([{ name: participantName, availability: cells }]);

		await gateway.onUpdate(cells, client);

		expect(participants.upsert).toHaveBeenCalledWith({
			where: { eventId_name: { eventId, name: participantName } },
			create: { eventId, name: participantName, availability: cells },
			update: { availability: cells }
		});
		expect(server.to).toHaveBeenCalledWith(eventId);
		expect(room.emit).toHaveBeenCalledWith('participants', { [participantName]: cells });
	});

	// Joining an event saves the participant's initial availability.
	it('saves availability when a participant joins', async () => {
		const client = createClient({ eventId });
		participants.upsert.mockResolvedValue({});
		participants.findMany.mockResolvedValue([{ name: participantName, availability: cells }]);

		await gateway.onJoin({ name: participantName, availability: cells }, client);

		expect(participants.upsert).toHaveBeenCalledWith({
			where: { eventId_name: { eventId, name: participantName } },
			create: { eventId, name: participantName, availability: cells },
			update: { availability: cells }
		});
		expect(room.emit).toHaveBeenCalledWith('participants', { [participantName]: cells });
	});

	it('ignores malformed availability cells', async () => {
		const client = createClient({ eventId });

		await gateway.onJoin({ name: participantName, availability: ['invalid'] }, client);

		expect(participants.upsert).not.toHaveBeenCalled();
	});

	it('reports database errors to the client', async () => {
		const emit = vi.fn();
		const client = { data: {}, join: vi.fn(), emit } as never;
		event.findUnique.mockRejectedValue(new Error('database failed'));

		await gateway.onWatch(eventId, client);

		expect(emit).toHaveBeenCalledWith('error', 'Unable to load event');
	});
});
