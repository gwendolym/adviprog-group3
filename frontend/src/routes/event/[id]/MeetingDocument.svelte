<script lang="ts">
	import { onMount } from 'svelte';
	import { createMeetingDocumentPresenter } from '$lib/presenters/meeting-document.presenter.svelte';

	let { eventId, isOwner }: { eventId: string; isOwner: boolean } = $props();
	const presenter = createMeetingDocumentPresenter(
		() => eventId,
		() => isOwner
	);

	onMount(() => presenter.initialize());
</script>

<section
	class="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
>
	<h2 class="text-xl font-semibold">Meeting document</h2>
	<p class="mt-1 text-sm text-slate-500">Prepare an agenda and record notes together.</p>

	{#if presenter.errorMessage}
		<p role="alert" class="mt-4 text-sm text-red-600">{presenter.errorMessage}</p>
	{/if}

	<div class="mt-6 grid gap-6 lg:grid-cols-2">
		<label class="block">
			<span class="font-medium">Agenda</span>
			<textarea
				value={presenter.agenda}
				readonly={!isOwner}
				oninput={(event) => presenter.saveAgenda(event.currentTarget.value)}
				disabled={presenter.agendaStatus === 'loading'}
				maxlength="20000"
				rows="10"
				class="mt-2 w-full rounded-lg border border-slate-300 p-3 dark:border-slate-700 dark:bg-slate-950"
			></textarea>
			{#if !isOwner}
				<p class="text-sm text-slate-500 dark:text-slate-400">
					Only the meeting owner can edit the agenda.
				</p>
			{/if}
			<span class="text-sm text-slate-500">{presenter.agendaStatus}</span>
		</label>

		<label class="block">
			<span class="font-medium">Notes</span>
			<textarea
				value={presenter.notes}
				oninput={(event) => presenter.saveNotes(event.currentTarget.value)}
				disabled={presenter.notesStatus === 'loading'}
				maxlength="20000"
				rows="10"
				class="mt-2 w-full rounded-lg border border-slate-300 p-3 dark:border-slate-700 dark:bg-slate-950"
			></textarea>
			<span class="text-sm text-slate-500">{presenter.notesStatus}</span>
		</label>
	</div>
</section>
