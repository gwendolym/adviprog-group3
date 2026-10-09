import { SvelteSet } from 'svelte/reactivity';
import { cellKey, type Day } from '$lib/availability';
import { createAvailabilitySocket, type Participants } from '$lib/persistence/availability.socket';

export function createAvailabilityPresenter(eventId: string) {
	let participantName = $state('');
	const selectedCells = new SvelteSet<string>();
	let copied = $state(false);
	let joined = $state(false);
	let dragging = $state(false);
	let dragMode = $state<'add' | 'remove'>('add');
	let participants = $state<Participants>({});
	let hoveredAvailability = $state<string | null>(null);
	let availabilityHovered = $state(false);
	let socket: ReturnType<typeof createAvailabilitySocket> | undefined;

	const canJoin = $derived(participantName.trim().length > 0);
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

	function onSocketConnect() {
		socket?.watch(eventId);
		if (joined) socket?.update([...selectedCells]);
	}

	function applyDragMode(key: string) {
		if (dragMode === 'add') selectedCells.add(key);
		else selectedCells.delete(key);
	}

	return {
		get participantName() {
			return participantName;
		},
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
		get canJoin() {
			return canJoin;
		},
		get participantCount() {
			return participantCount;
		},
		initialize() {
			socket = createAvailabilitySocket();
			socket.onParticipants(onParticipants);
			socket.onConnect(onSocketConnect);

			return function disconnect() {
				socket?.disconnect();
			};
		},
		setParticipantName(name: string) {
			participantName = name;
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
				joined = false;
				return;
			}

			socket?.join({
				name: participantName.trim(),
				availability: [...selectedCells]
			});
			joined = true;
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
			if (count === 0) return 'bg-red-100 text-red-300';

			const ratio = count / participantCount;
			if (ratio <= 0.25) return 'bg-green-200 text-green-900';
			if (ratio <= 0.5) return 'bg-green-400 text-green-950';
			if (ratio <= 0.75) return 'bg-green-600 text-white';
			return 'bg-green-800 text-white';
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
