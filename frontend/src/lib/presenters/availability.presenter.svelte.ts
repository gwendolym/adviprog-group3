import { SvelteSet } from 'svelte/reactivity';
import { cellKey, type Day } from '$lib/availability';
import { createAvailabilitySocket, type Participants } from '$lib/persistence/availability.socket';

export function createAvailabilityPresenter(eventId: string) {
	const selectedCells = new SvelteSet<string>();
	let copied = $state(false); // Reactive feedback state must be mutable.
	let joined = $state(false); // Reactive connection state must be mutable.
	let dragging = $state(false); // Reactive pointer state must be mutable.
	let dragMode = $state<'add' | 'remove'>('add'); // Reactive pointer state must be mutable.
	let participants = $state<Participants>({}); // Reactive server state must be mutable.
	let hoveredAvailability = $state<string | null>(null); // Reactive hover state must be mutable.
	let availabilityHovered = $state(false); // Reactive hover state must be mutable.
	let socket: ReturnType<typeof createAvailabilitySocket> | undefined; // Socket is assigned during mount.

	const participantCount = $derived(Object.keys(participants).length);

	$effect(function syncAvailability() {
		if (!joined) return;

		const cells = [...selectedCells];
		const timeout = setTimeout(function sendDebouncedAvailability() {
			socket?.update(cells);
		}, 150);

		return function cancelDebouncedAvailability() {
			clearTimeout(timeout);
		};
	});

	function onParticipants(all: Participants) {
		participants = all;
	}

	function onAvailability(cells: string[]) {
		selectedCells.clear();
		for (const cell of cells) selectedCells.add(cell);
	}

	function onSocketConnect() {
		socket?.watch(eventId);
		if (joined) {
			socket?.join({ availability: [...selectedCells] });
		}
	}

	function applyDragMode(key: string) {
		// Set mutation preserves the drag-selection interaction state.
		if (dragMode === 'add') selectedCells.add(key);
		else selectedCells.delete(key);
	}

	return {
		get selectedCells() {
			return selectedCells;
		},
		get copied() {
			return copied;
		},
		get joined() {
			return joined;
		},
		get participants() {
			return participants;
		},
		get hoveredAvailability() {
			return hoveredAvailability;
		},
		get availabilityHovered() {
			return availabilityHovered;
		},
		get participantCount() {
			return participantCount;
		},
		initialize() {
			socket = createAvailabilitySocket();
			socket.onParticipants(onParticipants);
			socket.onAvailability(onAvailability);
			socket.onConnect(onSocketConnect);

			return function disconnect() {
				socket?.disconnect();
			};
		},
		startCellDrag(event: PointerEvent) {
			const key = (event.currentTarget as HTMLElement).dataset.key;
			if (!key) return;
			dragMode = selectedCells.has(key) ? 'remove' : 'add';
			dragging = true;
			applyDragMode(key);
		},
		dragOverCell(event: PointerEvent) {
			availabilityHovered = true;
			const key = (event.currentTarget as HTMLElement).dataset.key;
			if (dragging && key) applyDragMode(key);
		},
		leaveCell() {
			availabilityHovered = false;
		},
		join() {
			if (joined) {
				socket?.leave();
				joined = false;
				selectedCells.clear();
				return;
			}

			joined = true;
			socket?.join({ availability: [...selectedCells] });
		},
		copyLink() {
			navigator.clipboard.writeText(window.location.href);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 1600);
		},
		availableCount(day: Day, time: string) {
			const key = cellKey(day, time);
			return Object.values(participants).filter((cells) => cells.includes(key)).length;
		},
		availabilityClass(count: number) {
			if (count === 0) return 'bg-red-100 text-red-300 dark:bg-red-950/60 dark:text-red-300';

			const ratio = count / participantCount;
			if (ratio <= 0.25)
				return 'bg-green-200 text-green-900 dark:bg-green-900/60 dark:text-green-200';
			if (ratio <= 0.5)
				return 'bg-green-400 text-green-950 dark:bg-green-700/80 dark:text-green-100';
			if (ratio <= 0.75) return 'bg-green-600 text-white dark:bg-green-600';
			return 'bg-green-800 text-white dark:bg-green-800';
		},
		isAvailableOnHoveredCell(name: string) {
			return hoveredAvailability !== null && participants[name]?.includes(hoveredAvailability);
		},
		setHoveredAvailability(event: MouseEvent) {
			hoveredAvailability = (event.currentTarget as HTMLElement).dataset.key ?? null;
		},
		clearHoveredAvailability() {
			hoveredAvailability = null;
		},
		stopDragging() {
			dragging = false;
		}
	};
}
