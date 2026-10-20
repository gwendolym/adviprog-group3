import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMeetingDocumentPresenter } from '$lib/presenters/meeting-document.presenter.svelte';

const socket = vi.hoisted(() => ({
	onConnect: vi.fn(),
	onDocument: vi.fn(),
	onSectionUpdated: vi.fn(),
	onSaved: vi.fn(),
	onError: vi.fn(),
	watch: vi.fn(),
	updateSection: vi.fn(),
	disconnect: vi.fn()
}));

vi.mock('$lib/persistence/meeting-document.socket', () => ({
	createMeetingDocumentSocket: () => socket
}));

describe('meeting document presenter', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('lets a participant edit notes but not the agenda', () => {
		const presenter = createMeetingDocumentPresenter(
			() => 'event-1',
			() => false
		);
		const cleanup = presenter.initialize();

		presenter.saveAgenda('Changed agenda');
		presenter.saveNotes('Meeting notes');
		vi.advanceTimersByTime(500);

		expect(socket.updateSection).not.toHaveBeenCalledWith('agenda', 'Changed agenda');
		expect(socket.updateSection).toHaveBeenCalledWith('notes', 'Meeting notes');

		cleanup();
	});
});
