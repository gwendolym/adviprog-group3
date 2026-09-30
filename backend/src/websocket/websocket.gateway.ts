import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	MessageBody,
	ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
	cors: {
		origin: 'http://localhost:5173'
	}
})
export class WebsocketGateway {
	@WebSocketServer()
	server: Server;

	// eventId -> { participant name -> selected cell keys }
	private events: Record<string, Record<string, string[]>> = {};

	@SubscribeMessage('watch')
	handleWatch(@MessageBody() eventId: string, @ConnectedSocket() client: Socket) {
		client.data.eventId = eventId;
		this.events[eventId] ??= {};
		client.join(eventId);
		client.emit('participants', this.events[eventId]);
	}

	@SubscribeMessage('join')
	handleJoin(@MessageBody() name: string, @ConnectedSocket() client: Socket) {
		const { eventId } = client.data;
		if (!eventId) return;
		client.data.name = name;
		this.events[eventId][name] ??= [];
		this.server.to(eventId).emit('participants', this.events[eventId]);
	}

	@SubscribeMessage('update')
	handleUpdate(@MessageBody() cells: string[], @ConnectedSocket() client: Socket) {
		const { eventId, name } = client.data;
		if (!eventId || !name) return;
		this.events[eventId][name] = cells;
		this.server.to(eventId).emit('participants', this.events[eventId]);
	}
}