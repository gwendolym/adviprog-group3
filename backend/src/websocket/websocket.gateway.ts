import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	MessageBody,
	ConnectedSocket,
	OnGatewayConnection
} from '@nestjs/websockets';
import { WsAuthenticator } from '@nestjs/authentication';
import { PrismaService } from '../prisma/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { Server, Socket } from 'socket.io';
import { MeetingDocumentsService } from '../meeting-documents/meeting-documents.service.js';
import { MEETING_DOCUMENT_MAX_LENGTH, type MeetingDocumentSection, } from '../meeting-documents/meeting-document.dto.js';

@WebSocketGateway({
	path: '/sockets',
	cors: {
		origin: true,
		credentials: true
	}
})
export class WebsocketGateway implements OnGatewayConnection {
	constructor(
		private readonly prisma: PrismaService,
		private readonly wsAuth: WsAuthenticator,
		private readonly documents: MeetingDocumentsService,
		private readonly events: EventsService
	) { }

	@WebSocketServer()
	server: Server;

	async handleConnection(client: Socket) {
		const result = await this.wsAuth.authenticateConnection(client, undefined, { required: true });
		const user = result?.user as { id: number } | undefined;
		if (user) client.data.userId = user.id;
	}

	@SubscribeMessage('watch')
	async onWatch(
		@MessageBody() eventId: string,
		@ConnectedSocket() client: Socket
	) {
		if (typeof eventId !== 'string') return;
		delete client.data.eventId;
		try {
			const event = await this.prisma.event.findUnique({ where: { id: eventId } });
			if (!event) return;
			if (!client.data.userId || !(await this.events.canAccess(event, client.data.userId))) {
				client.emit('error', "Not a member of this event's team");
				return;
			}
			client.data.eventId = eventId;
			client.data.teamId = event.teamId;
			await client.join(eventId);
			const [participants, own] = await Promise.all([
				this.getParticipants(eventId, event.teamId),
				this.prisma.participant.findFirst({ where: { eventId, userId: client.data.userId } })
			]);
			client.emit('participants', participants);
			client.emit('availability', own?.availability ?? []);
		} catch {
			client.emit('error', 'Unable to load event');
		}
	}

	@SubscribeMessage('join')
	async onJoin(
		@MessageBody() payload: { availability: string[] },
		@ConnectedSocket() client: Socket
	) {
		const { eventId, userId, teamId } = client.data;
		if (
			!eventId ||
			!userId ||
			!payload ||
			!Array.isArray(payload.availability) ||
			!payload.availability.every((cell) => this.isValidCell(cell))
		)
			return;
		try {
			await this.saveAvailability(eventId, userId, payload.availability);
			await this.broadcastParticipants(eventId, teamId ?? null);
		} catch {
			client.emit('error', 'Unable to save availability');
		}
	}

	@SubscribeMessage('update')
	async onUpdate(@MessageBody() cells: string[], @ConnectedSocket() client: Socket) {
		const { eventId, userId, teamId } = client.data;
		if (
			!eventId ||
			!userId ||
			!Array.isArray(cells) ||
			!cells.every((cell) => this.isValidCell(cell))
		)
			return;
		try {
			await this.saveAvailability(eventId, userId, cells);
			await this.broadcastParticipants(eventId, teamId ?? null);
		} catch {
			client.emit('error', 'Unable to save availability');
		}
	}

	@SubscribeMessage('leave')
	async onLeave(@ConnectedSocket() client: Socket) {
		const { eventId, userId, teamId } = client.data;
		if (!eventId || !userId) return;

		try {
			await this.prisma.participant.deleteMany({ where: { eventId, userId } });
			await this.broadcastParticipants(eventId, teamId ?? null);
		} catch {
			client.emit('error', 'Unable to remove availability');
		}
	}

	private async getParticipants(
		eventId: string,
		teamId: string | null
	): Promise<Record<string, string[]>> {
		const [rows, members] = await Promise.all([
			this.prisma.participant.findMany({
				where: { eventId },
				include: { user: { select: { email: true } } }
			}),
			teamId
				? this.prisma.teamMember.findMany({
						where: { teamId },
						include: { user: { select: { email: true } } }
					})
				: null
		]);
		const responses = Object.fromEntries(
			rows.map(({ name, availability, user }) => [user?.email ?? name, availability])
		);
		if (!members) return responses;

		// Team events list every current member, with no availability until they respond
		return Object.fromEntries(
			members.map(({ user }) => [user.email, responses[user.email] ?? []])
		);
	}

	private async saveAvailability(eventId: string, userId: number, availability: string[]) {
		const user = await this.prisma.user.findUnique({ where: { id: userId } });
		if (!user) return;

		const existing = await this.prisma.participant.findFirst({ where: { eventId, userId } });
		if (existing) {
			await this.prisma.participant.update({ where: { id: existing.id }, data: { availability } });
		} else {
			await this.prisma.participant.create({
				data: { eventId, userId, name: user.email, availability }
			});
		}
	}

	private async broadcastParticipants(eventId: string, teamId: string | null) {
		this.server.to(eventId).emit('participants', await this.getParticipants(eventId, teamId));
	}

	private isValidCell(cell: unknown): cell is string {
		return typeof cell === 'string' && /^[A-Z][a-z]{2} \d{1,2}-(?:[01]\d|2[0-3]):00$/.test(cell);
	}

	@SubscribeMessage('watch-document')
	async onWatchDocument(
		@MessageBody() eventId: string,
		@ConnectedSocket() client: Socket,
	) {
		const { userId, documentEventId: previousEventId } = client.data;

		if (typeof eventId !== 'string' || !userId) return;

		try {
			const document = await this.documents.findForEvent(eventId, userId);

			if (previousEventId && previousEventId !== eventId) {
				await client.leave(`document:${previousEventId}`);
			}

			client.data.documentEventId = eventId;
			await client.join(`document:${eventId}`);
			client.emit('meeting-document', document);
		} catch {
			client.emit('document-error', 'Unable to load this meeting document');
		}
	}

	@SubscribeMessage('update-document-section')
	async onUpdateDocumentSection(
		@MessageBody() payload: { section: MeetingDocumentSection; content: string },
		@ConnectedSocket() client: Socket,
	) {
		const { documentEventId: eventId, userId } = client.data;

		if (
			!eventId ||
			!userId ||
			!payload ||
			(payload.section !== 'agenda' && payload.section !== 'notes') ||
			typeof payload.content !== 'string' ||
			payload.content.length > MEETING_DOCUMENT_MAX_LENGTH
		) {
			client.emit('document-error', 'Invalid document update');
			return;
		}

		try {
			const document = await this.documents.updateSection(
			eventId,
			userId,
			payload.section,
			payload.content,
			);

			const update = {
			section: payload.section,
			content: payload.content,
			updatedAt: document.updatedAt.toISOString(),
			};

			client.emit('document-saved', update);
			client.to(`document:${eventId}`).emit('document-section-updated', update);
		} catch {
			client.emit('document-error', 'Unable to save meeting document');
		}
	}
}
