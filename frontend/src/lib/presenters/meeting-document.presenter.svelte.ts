import { createMeetingDocumentSocket } from '$lib/persistence/meeting-document.socket';

export function createMeetingDocumentPresenter(
	getEventId: () => string,
	getIsOwner: () => boolean
) {
	type Status = 'loading' | 'saving' | 'saved';
	let agenda = $state('');
	let notes = $state('');
	let agendaStatus = $state<Status>('loading');
	let notesStatus = $state<Status>('loading');
	let errorMessage = $state('');
	let agendaTimer: ReturnType<typeof setTimeout> | undefined;
	let notesTimer: ReturnType<typeof setTimeout> | undefined;
	let socket: ReturnType<typeof createMeetingDocumentSocket> | undefined;

	function saveAgenda(text: string) {
		const isOwner = getIsOwner();
		if (!isOwner) {
			return;
		}
		agenda = text;
		agendaStatus = 'saving';
		errorMessage = '';

		clearTimeout(agendaTimer);
		agendaTimer = setTimeout(() => {
			socket?.updateSection('agenda', text); // calls onUpdateDocumentSection
		}, 500);
	}

	function saveNotes(text: string) {
		notes = text;
		notesStatus = 'saving';
		errorMessage = '';

		clearTimeout(notesTimer);
		notesTimer = setTimeout(() => {
			socket?.updateSection('notes', text); // calls onUpdateDocumentSection
		}, 500);
	}

	// Open connection, fetch document, register responses and update.
	function initialize() {
		const connection = createMeetingDocumentSocket();
		socket = connection;

		connection.onConnect(() => connection.watch(getEventId()));

		connection.onDocument((document) => {
			if (agendaStatus !== 'saving') {
				agenda = document.agenda;
				agendaStatus = 'saved';
			}
			if (notesStatus !== 'saving') {
				notes = document.notes;
				notesStatus = 'saved';
			}
			errorMessage = '';
		});

		connection.onSectionUpdated((update) => {
			if (update.section === 'agenda' && agendaStatus !== 'saving') {
				agenda = update.content;
			}

			if (update.section === 'notes' && notesStatus !== 'saving') {
				notes = update.content;
			}
		});

		connection.onSaved((update) => {
			if (update.section === 'agenda' && update.content === agenda) {
				agendaStatus = 'saved';
			}

			if (update.section === 'notes' && update.content === notes) {
				notesStatus = 'saved';
			}
		});

		connection.onError((message) => {
			errorMessage = message;
		});

		return () => {
			clearTimeout(agendaTimer);
			clearTimeout(notesTimer);
			connection.disconnect();
			socket = undefined;
		};
	}

	return {
		get agenda() {
			return agenda;
		},
		get notes() {
			return notes;
		},
		get agendaStatus() {
			return agendaStatus;
		},
		get notesStatus() {
			return notesStatus;
		},
		get errorMessage() {
			return errorMessage;
		},
		saveAgenda,
		saveNotes,
		initialize
	};
}
