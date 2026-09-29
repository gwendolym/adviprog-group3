<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import {
		buildDays,
		buildGridColumns,
		buildGridMinWidth,
		buildTimes,
		cellKey,
		type Day
	} from '$lib/availability';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const event = $derived(data.event);
	const times = $derived(buildTimes(event.startTime, event.endTime));
	const days = $derived(buildDays(event.dates));
	const gridColumns = $derived(buildGridColumns(days.length));
	const gridMinWidth = $derived(buildGridMinWidth(days.length));

	let participantName = $state('');
	let selectedCells = new SvelteSet<string>();
	let copied = $state(false);
	let joined = $state(false);
	let dragging = $state(false);
	let dragMode: 'add' | 'remove' = 'add';

	const canJoin = $derived(participantName.trim().length > 0);

	// There's no participants endpoint yet, so the team panel can only ever
	// reflect the current viewer once they've joined.
	const participantCount = $derived(joined ? 1 : 0);

	function applyDragMode(key: string) {
		if (dragMode === 'add') selectedCells.add(key);
		else selectedCells.delete(key);
	}

	function handleCellPointerDown(day: Day, time: string) {
		const key = cellKey(day, time);
		dragMode = selectedCells.has(key) ? 'remove' : 'add';
		dragging = true;
		applyDragMode(key);
	}

	function handleCellPointerEnter(day: Day, time: string) {
		if (dragging) applyDragMode(cellKey(day, time));
	}

	function handleJoin() {
		joined = true;
	}

	function handleCopyLink() {
		navigator.clipboard.writeText(window.location.href);
		copied = true;
		setTimeout(() => (copied = false), 1600);
	}

	function isTeamAvailable(day: Day, time: string) {
		return joined && selectedCells.has(cellKey(day, time));
	}
</script>

{#snippet gridHeader()}
	<div
		class="border-b border-slate-200"
		style="display: grid; grid-template-columns: {gridColumns}"
	>
		<div></div>

		{#each days as day (day.date)}
			<div class="border-l border-slate-200 px-1 pb-3 text-center">
				<div class="text-xs text-slate-500">{day.label}</div>
				<div class="mt-1 text-sm font-medium text-slate-900">{day.date}</div>
			</div>
		{/each}
	</div>
{/snippet}

<svelte:window onpointerup={() => (dragging = false)} />

<svelte:head>
	<title>{event.name} | Meetly</title>
</svelte:head>

<section class="min-h-[calc(100vh-160px)] bg-slate-50 px-4 py-8 sm:px-6">
	<div class="mx-auto max-w-6xl">
		<div class="mb-8 flex flex-wrap items-end justify-between gap-4">
			<div>
				<p class="text-sm font-medium text-slate-500">Meeting availability</p>
				<h1 class="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{event.name}</h1>
				<p class="mt-2 text-sm text-slate-500">
					{event.startTime} - {event.endTime} ({event.timezone})
				</p>
			</div>

			<button
				type="button"
				class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
				onclick={handleCopyLink}
			>
				{copied ? 'Copied' : 'Copy link'}
			</button>
		</div>

		<div class="grid gap-6 lg:grid-cols-2">
			<section class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
				<div class="mb-5 flex flex-wrap items-start justify-between gap-3">
					<div>
						<p class="text-xs font-medium tracking-wide text-slate-400 uppercase">Step 1</p>
						<h2 class="mt-1 font-medium text-slate-900">Your availability</h2>
						<p class="mt-1 text-sm text-slate-500">
							Enter your name and select the times that work for you.
						</p>
					</div>

					<span class="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
						{selectedCells.size} selected
					</span>
				</div>

				<label class="block text-sm font-medium text-slate-700" for="name">
					Your name
					<input
						id="name"
						bind:value={participantName}
						class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-500"
					/>
				</label>

				<div class="mt-5 overflow-x-auto">
					<div style="min-width: {gridMinWidth}">
						{@render gridHeader()}

						<div class="select-none" style="display: grid; grid-template-columns: {gridColumns}">
							{#each times as time (time)}
								<div class="flex h-10 items-center pr-2 text-[11px] text-slate-500">
									{time}
								</div>

								{#each days as day (day.date)}
									{@const isSelected = selectedCells.has(cellKey(day, time))}

									<button
										type="button"
										aria-label={`${day.date} ${time}`}
										aria-pressed={isSelected}
										class={`h-10 border-b border-l border-slate-200 transition ${
											isSelected ? 'bg-green-500' : 'bg-white hover:bg-green-100'
										}`}
										onpointerdown={() => handleCellPointerDown(day, time)}
										onpointerenter={() => handleCellPointerEnter(day, time)}
									></button>
								{/each}
							{/each}
						</div>
					</div>
				</div>

				<div
					class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"
				>
					<p class="text-xs text-slate-500">Click or drag to select your availability.</p>

					<button
						type="button"
						class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
						disabled={!canJoin}
						onclick={handleJoin}
					>
						{joined ? 'Availability saved' : 'Join event'}
					</button>
				</div>
			</section>

			<section class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
				<div class="mb-5 flex flex-wrap items-start justify-between gap-3">
					<div>
						<p class="text-xs font-medium tracking-wide text-slate-400 uppercase">Step 2</p>
						<h2 class="mt-1 font-medium text-slate-900">Team availability</h2>
						<p class="mt-1 text-sm text-slate-500">See when everyone is available.</p>
					</div>

					<span class="text-sm text-slate-500">{participantCount} participant</span>
				</div>

				<div class="overflow-x-auto">
					<div style="min-width: {gridMinWidth}">
						{@render gridHeader()}

						<div style="display: grid; grid-template-columns: {gridColumns}">
							{#each times as time (time)}
								<div class="flex h-10 items-center pr-2 text-[11px] text-slate-500">
									{time}
								</div>

								{#each days as day (day.date)}
									{@const available = isTeamAvailable(day, time)}

									<div
										class={`flex h-10 items-center justify-center border-b border-l border-slate-200 text-xs font-medium transition ${
											available ? 'bg-green-700 text-white' : 'bg-red-100 text-red-300'
										}`}
									>
										{available ? `1/${participantCount}` : ''}
									</div>
								{/each}
							{/each}
						</div>
					</div>
				</div>

				<div
					class="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500"
				>
					<span class="flex items-center gap-2">
						<span class="h-3 w-3 rounded-sm bg-red-100"></span>
						Unavailable
					</span>

					<span class="flex items-center gap-2">
						<span class="h-3 w-3 rounded-sm bg-green-700"></span>
						Available
					</span>
				</div>
			</section>
		</div>
	</div>
</section>