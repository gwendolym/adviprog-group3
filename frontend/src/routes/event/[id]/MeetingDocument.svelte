<script lang="ts">
	import { onMount } from 'svelte';
	import { createMeetingDocumentSocket } from '$lib/persistence/meeting-document.socket';

	let { eventId }: { eventId: string } = $props();
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
	onMount(() => {
		const connection = createMeetingDocumentSocket();
		socket = connection;

		connection.onConnect(() => connection.watch(eventId));

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
	});
</script>

<section
	class="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
>
	<h2 class="text-xl font-semibold">Meeting document</h2>
	<p class="mt-1 text-sm text-slate-500">Prepare an agenda and record notes together.</p>

	{#if errorMessage}
		<p role="alert" class="mt-4 text-sm text-red-600">{errorMessage}</p>
	{/if}

	<div class="mt-6 grid gap-6 lg:grid-cols-2">
		<label class="block">
			<span class="font-medium">Agenda</span>
			<textarea
				value={agenda}
				oninput={(event) => saveAgenda(event.currentTarget.value)}
				disabled={agendaStatus === 'loading'}
				maxlength="20000"
				rows="10"
				class="mt-2 w-full rounded-lg border border-slate-300 p-3 dark:border-slate-700 dark:bg-slate-950"
			></textarea>
			<span class="text-sm text-slate-500">{agendaStatus}</span>
		</label>

		<label class="block">
			<span class="font-medium">Notes</span>
			<textarea
				value={notes}
				oninput={(event) => saveNotes(event.currentTarget.value)}
				disabled={notesStatus === 'loading'}
				maxlength="20000"
				rows="10"
				class="mt-2 w-full rounded-lg border border-slate-300 p-3 dark:border-slate-700 dark:bg-slate-950"
			></textarea>
			<span class="text-sm text-slate-500">{notesStatus}</span>
		</label>
	</div>
</section>
