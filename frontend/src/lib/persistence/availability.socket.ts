import { io, type Socket } from 'socket.io-client';

export type Participants = Record<string, string[]>;

type AvailabilitySocket = Socket<
	{
		participants: (participants: Participants) => void;
		availability: (cells: string[]) => void;
	},
	{
		watch: (eventId: string) => void;
		join: (payload: { availability: string[] }) => void;
		leave: () => void;
		update: (cells: string[]) => void;
	}
>;

export function createAvailabilitySocket() {
	const socket: AvailabilitySocket = io({
		path: '/sockets',
		withCredentials: true,
		transports: ['polling']
	});

	return {
		onParticipants(handler: (participants: Participants) => void) {
			socket.on('participants', handler);
		},
		onAvailability(handler: (cells: string[]) => void) {
			socket.on('availability', handler);
		},
		onConnect(handler: () => void) {
			socket.on('connect', handler);
		},
		watch(eventId: string) {
			socket.emit('watch', eventId);
		},
		join(payload: { availability: string[] }) {
			socket.emit('join', payload);
		},
		leave() {
			socket.emit('leave');
		},
		update(cells: string[]) {
			socket.emit('update', cells);
		},
		disconnect() {
			socket.disconnect();
		}
	};
}
