import { io, type Socket } from 'socket.io-client';
import { env } from '$env/dynamic/public';

export type Participants = Record<string, string[]>;

type AvailabilitySocket = Socket<
	{ participants: (participants: Participants) => void },
	{
		watch: (eventId: string) => void;
		join: (payload: { name: string; availability: string[] }) => void;
		update: (cells: string[]) => void;
	}
>;

export function createAvailabilitySocket() {
	const socket: AvailabilitySocket = io(env.PUBLIC_API_URL || undefined, { path: '/sockets' });

	return {
		onParticipants(handler: (participants: Participants) => void) {
			socket.on('participants', handler);
		},
		onConnect(handler: () => void) {
			socket.on('connect', handler);
		},
		watch(eventId: string) {
			socket.emit('watch', eventId);
		},
		join(payload: { name: string; availability: string[] }) {
			socket.emit('join', payload);
		},
		update(cells: string[]) {
			socket.emit('update', cells);
		},
		disconnect() {
			socket.disconnect();
		}
	};
}
