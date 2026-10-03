import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	MessageBody,
	ConnectedSocket
} from '@nestjs/websockets';
import { PrismaService } from '../prisma/prisma.service.js';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
	path: '/sockets',
	cors: {
		origin: true
	}
})
export class WebsocketGateway {
	constructor(private readonly prisma: PrismaService) { }

	@WebSocketServer()
	server: Server;

	@SubscribeMessage('watch')
	async onWatch(
		@MessageBody() eventId: string,
		@ConnectedSocket() client: Socket
	) {
		if (typeof eventId !== 'string') return;
		client.data.eventId = eventId;
		client.join(eventId);
		client.emit('participants', await this.getParticipants(eventId));
	}

	@SubscribeMessage('join')
	async onJoin(
		@MessageBody() payload: { name: string; availability: string[] },
		@ConnectedSocket() client: Socket
	) {
		const { eventId } = client.data;
		if (
			!eventId ||
			!payload ||
			typeof payload.name !== 'string' ||
			!payload.name.trim() ||
			!Array.isArray(payload.availability) ||
			!payload.availability.every((cell) => typeof cell === 'string')
		)
			return;
		client.data.name = payload.name.trim();
		await this.prisma.participant.upsert({
			where: { eventId_name: { eventId, name: client.data.name } },
			create: { eventId, name: client.data.name, availability: payload.availability },
			update: { availability: payload.availability }
		});
		await this.broadcastParticipants(eventId);
	}

	@SubscribeMessage('update')
	async onUpdate(@MessageBody() cells: string[], @ConnectedSocket() client: Socket) {
		const { eventId, name } = client.data;
		if (
			!eventId ||
			!name ||
			!Array.isArray(cells) ||
			!cells.every((cell) => typeof cell === 'string')
		)
			return;
		await this.prisma.participant.upsert({
			where: { eventId_name: { eventId, name } },
			create: { eventId, name, availability: cells },
			update: { availability: cells }
		});
		await this.broadcastParticipants(eventId);
	}

	private async getParticipants(eventId: string): Promise<Record<string, string[]>> {
		const rows = await this.prisma.participant.findMany({ where: { eventId } });
		return Object.fromEntries(rows.map(({ name, availability }) => [name, availability]));
	}

	private async broadcastParticipants(eventId: string) {
		this.server.to(eventId).emit('participants', await this.getParticipants(eventId));
	}
}
