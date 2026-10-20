import { io, type Socket } from 'socket.io-client';

export type DocumentSection = 'agenda' | 'notes';

export type MeetingDocument = {
	agenda: string;
	notes: string;
	updatedAt: string | null;
};

export type SectionUpdate = {
	section: DocumentSection;
	content: string;
	updatedAt: string;
};

type DocumentSocket = Socket<
	// from backend to browser
	{
		'meeting-document': (document: MeetingDocument) => void;
		'document-section-updated': (update: SectionUpdate) => void;
		'document-saved': (update: SectionUpdate) => void;
		'document-error': (message: string) => void;
	},
	// from browser to backend
	{
		'watch-document': (eventId: string) => void;
		'update-document-section': (update: { section: DocumentSection; content: string }) => void;
	}
>;

export function createMeetingDocumentSocket() {
	const socket: DocumentSocket = io({
		// open connection
		path: '/sockets',
		withCredentials: true,
		transports: ['polling']
	});

	return {
		onConnect(handler: () => void) {
			socket.on('connect', handler);
		},
		onDocument(handler: (document: MeetingDocument) => void) {
			socket.on('meeting-document', handler);
		},
		onSectionUpdated(handler: (update: SectionUpdate) => void) {
			socket.on('document-section-updated', handler);
		},
		onSaved(handler: (update: SectionUpdate) => void) {
			socket.on('document-saved', handler);
		},
		onError(handler: (message: string) => void) {
			socket.on('document-error', handler);
		},
		watch(eventId: string) {
			socket.emit('watch-document', eventId); // calls onWatchDocument, will emit 'meeting-document'
		},
		updateSection(section: DocumentSection, content: string) {
			// will get called upon user input
			socket.emit('update-document-section', { section, content }); // sends message over channel => calls onUpdateDocumentSection that emit 'document-section-updated' to other viewers
		},
		disconnect() {
			socket.disconnect();
		}
	};
}
