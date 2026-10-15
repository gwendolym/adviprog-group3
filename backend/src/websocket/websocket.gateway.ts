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
import { Server, Socket } from 'socket.io';

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
		private readonly wsAuth: WsAuthenticator
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
		try {
			const event = await this.prisma.event.findUnique({ where: { id: eventId } });
			if (!event) return;
			client.data.eventId = eventId;
			await client.join(eventId);
			client.emit('participants', await this.getParticipants(eventId));
			const own = await this.prisma.participant.findFirst({ where: { eventId, userId: client.data.userId } });
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
		const { eventId, userId } = client.data;
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
			await this.broadcastParticipants(eventId);
		} catch {
			client.emit('error', 'Unable to save availability');
		}
	}

	@SubscribeMessage('update')
	async onUpdate(@MessageBody() cells: string[], @ConnectedSocket() client: Socket) {
		const { eventId, userId } = client.data;
		if (
			!eventId ||
			!userId ||
			!Array.isArray(cells) ||
			!cells.every((cell) => this.isValidCell(cell))
		)
			return;
		try {
			await this.saveAvailability(eventId, userId, cells);
			await this.broadcastParticipants(eventId);
		} catch {
			client.emit('error', 'Unable to save availability');
		}
	}

	@SubscribeMessage('leave')
	async onLeave(@ConnectedSocket() client: Socket) {
		const { eventId, userId } = client.data;
		if (!eventId || !userId) return;

		try {
			await this.prisma.participant.deleteMany({ where: { eventId, userId } });
			await this.broadcastParticipants(eventId);
		} catch {
			client.emit('error', 'Unable to remove availability');
		}
	}

	private async getParticipants(eventId: string): Promise<Record<string, string[]>> {
		const rows = await this.prisma.participant.findMany({
			where: { eventId },
			include: { user: { select: { email: true } } }
		});
		return Object.fromEntries(
			rows.map(({ name, availability, user }) => [user?.email ?? name, availability])
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

	private async broadcastParticipants(eventId: string) {
		this.server.to(eventId).emit('participants', await this.getParticipants(eventId));
	}

	private isValidCell(cell: unknown): cell is string {
		return typeof cell === 'string' && /^[A-Z][a-z]{2} \d{1,2}-(?:[01]\d|2[0-3]):00$/.test(cell);
	}
}
