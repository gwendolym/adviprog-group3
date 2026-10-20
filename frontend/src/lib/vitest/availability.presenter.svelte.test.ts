import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cellKey } from '$lib/availability';
import type { Participants } from '$lib/persistence/availability.socket';
import { createAvailabilityPresenter } from '$lib/presenters/availability.presenter.svelte';

const socket = vi.hoisted(() => ({
	handlers: {} as Record<string, (value?: unknown) => void>,
	watch: vi.fn(),
	join: vi.fn(),
	leave: vi.fn(),
	update: vi.fn(),
	disconnect: vi.fn()
}));

vi.mock('$lib/persistence/availability.socket', () => ({
	createAvailabilitySocket: () => ({
		onParticipants: (handler: (value?: unknown) => void) =>
			(socket.handlers.participants = handler),
		onAvailability: (handler: (value?: unknown) => void) =>
			(socket.handlers.availability = handler),
		onConnect: (handler: (value?: unknown) => void) => (socket.handlers.connect = handler),
		watch: socket.watch,
		join: socket.join,
		leave: socket.leave,
		update: socket.update,
		disconnect: socket.disconnect
	})
}));

const day = { label: 'Mon 20', date: '2026-10-20' };

function cell(key: string) {
	const element = document.createElement('div');
	element.dataset.key = key;
	return { currentTarget: element } as unknown as PointerEvent;
}

describe('availability presenter', () => {
	let presenter: ReturnType<typeof createAvailabilityPresenter>;
	let cleanup: () => void;

	beforeEach(() => {
		vi.clearAllMocks();
		cleanup = $effect.root(() => {
			presenter = createAvailabilityPresenter('event-1');
			return presenter.initialize();
		});
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('watches the event when the socket connects', () => {
		socket.handlers.connect();

		expect(socket.watch).toHaveBeenCalledWith('event-1');
		expect(socket.join).not.toHaveBeenCalled();
	});

	it('rejoins with the current selection after a reconnect', () => {
		presenter.startCellDrag(cell('a'));
		presenter.join();
		socket.join.mockClear();

		socket.handlers.connect();

		expect(socket.join).toHaveBeenCalledWith({ availability: ['a'] });
	});

	it('selects cells by dragging and removes them when starting on a selected cell', () => {
		presenter.startCellDrag(cell('a'));
		presenter.dragOverCell(cell('b'));
		presenter.stopDragging();
		presenter.dragOverCell(cell('c'));
		expect([...presenter.selectedCells]).toEqual(['a', 'b']);

		presenter.startCellDrag(cell('a'));
		presenter.dragOverCell(cell('b'));

		expect(presenter.selectedCells.size).toBe(0);
	});

	it('joins with the selection and leaves by clearing it', () => {
		presenter.startCellDrag(cell('a'));

		presenter.join();
		expect(presenter.joined).toBe(true);
		expect(socket.join).toHaveBeenCalledWith({ availability: ['a'] });

		presenter.join();
		expect(presenter.joined).toBe(false);
		expect(socket.leave).toHaveBeenCalled();
		expect(presenter.selectedCells.size).toBe(0);
	});

	it('sends selection changes after a short pause, only once joined', () => {
		vi.useFakeTimers();
		presenter.startCellDrag(cell('a'));
		flushSync();
		vi.advanceTimersByTime(200);
		expect(socket.update).not.toHaveBeenCalled();

		presenter.join();
		presenter.dragOverCell(cell('b'));
		flushSync();
		vi.advanceTimersByTime(100);
		expect(socket.update).not.toHaveBeenCalled();

		vi.advanceTimersByTime(100);
		expect(socket.update).toHaveBeenCalledWith(['a', 'b']);
	});

	it('replaces the selection with what the server sends', () => {
		presenter.startCellDrag(cell('old'));

		socket.handlers.availability(['x', 'y']);

		expect([...presenter.selectedCells]).toEqual(['x', 'y']);
	});

	it('counts who is available in each cell', () => {
		const key = cellKey(day, '09:00');
		const participants: Participants = { Ada: [key], Bob: [key, 'other'], Cy: [] };

		socket.handlers.participants(participants);

		expect(presenter.participantCount).toBe(3);
		expect(presenter.availableCount(day, '09:00')).toBe(2);
		expect(presenter.availableCount(day, '10:00')).toBe(0);
	});

	it('shades cells by the share of available participants', () => {
		socket.handlers.participants({ a: [], b: [], c: [], d: [] });

		expect(presenter.availabilityClass(0)).toContain('bg-red-100');
		expect(presenter.availabilityClass(1)).toContain('bg-green-200');
		expect(presenter.availabilityClass(2)).toContain('bg-green-400');
		expect(presenter.availabilityClass(3)).toContain('bg-green-600');
		expect(presenter.availabilityClass(4)).toContain('bg-green-800');
	});

	it('highlights participants available in the hovered cell', () => {
		socket.handlers.participants({ Hannah: ['a'], Chris: ['b'] });

		presenter.setHoveredAvailability(cell('a') as unknown as MouseEvent);
		expect(presenter.isAvailableOnHoveredCell('Hannah')).toBe(true);
		expect(presenter.isAvailableOnHoveredCell('Chris')).toBe(false);

		presenter.clearHoveredAvailability();
		expect(presenter.isAvailableOnHoveredCell('Hannah')).toBe(false);
	});

	it('disconnects the socket on cleanup', () => {
		cleanup();
		cleanup = () => {};

		expect(socket.disconnect).toHaveBeenCalled();
	});
});
