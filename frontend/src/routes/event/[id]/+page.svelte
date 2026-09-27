<script lang="ts">
	import { parseISO, format } from 'date-fns';
	import { SvelteSet } from 'svelte/reactivity';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const event = $derived(data.event);

	type Day = { label: string; date: string };

	function hourOf(label: string) {
		return Number(label.slice(0, 2));
	}

	function labelOf(hour: number) {
		return `${String(hour).padStart(2, '0')}:00`;
	}

	const start = $derived(hourOf(event.startTime));
	const end = $derived(hourOf(event.endTime));

	const times = $derived.by(() => {
		const hourCount = (end >= start ? end - start : end + 24 - start) + 1;
		return Array.from({ length: hourCount }, (_, i) => labelOf((start + i) % 24));
	});

	const days = $derived(
		event.dates.map((date) => {
			const parsedDate = parseISO(date);
			return {
				label: format(parsedDate, 'EEE'),
				date: format(parsedDate, 'MMM d')
			};
		})
	);

	const gridColumns = $derived(`66px repeat(${days.length}, minmax(0, 1fr))`);
	const gridMinWidth = $derived(`${66 + days.length * 90}px`);

	let participantName = $state('');
	let selected = new SvelteSet<string>();
	let copied = $state(false);
	let joined = $state(false);
	let dragging = $state(false);
	let dragMode: 'add' | 'remove' = 'add';

	const eventUrl = $derived(typeof window === 'undefined' ? '' : window.location.href);
	const canJoin = $derived(participantName.trim().length > 0);

	// There's no participants endpoint yet, so the team panel can only ever
	// reflect the current viewer once they've joined.
	const participantCount = $derived(joined ? 1 : 0);

	function cellKey(day: Day, time: string) {
		return `${day.date}-${time}`;
	}

	function toggle(key: string) {
		if (dragMode === 'add') selected.add(key);
		else selected.delete(key);
	}

	function startDrag(day: Day, time: string) {
		const key = cellKey(day, time);
		dragMode = selected.has(key) ? 'remove' : 'add';
		dragging = true;
		toggle(key);
	}

	function continueDrag(day: Day, time: string) {
		if (dragging) toggle(cellKey(day, time));
	}

	function copyLink() {
		if (eventUrl) navigator.clipboard?.writeText(eventUrl);
		copied = true;
		setTimeout(() => (copied = false), 1600);
	}

	function isTeamAvailable(day: Day, time: string) {
		return joined && selected.has(cellKey(day, time));
	}
</script>

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
				onclick={copyLink}
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
						{selected.size} selected
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
						<div
							class="border-b border-slate-200"
							style="display: grid; grid-template-columns: {gridColumns}"
						>
							<div></div>

							{#each days as day}
								<div class="border-l border-slate-200 px-1 pb-3 text-center">
									<div class="text-xs text-slate-500">{day.label}</div>
									<div class="mt-1 text-sm font-medium text-slate-900">{day.date}</div>
								</div>
							{/each}
						</div>

						<div class="select-none" style="display: grid; grid-template-columns: {gridColumns}">
							{#each times as time}
								<div class="flex h-10 items-center pr-2 text-[11px] text-slate-500">
									{time}
								</div>

								{#each days as day}
									{@const key = cellKey(day, time)}
									{@const isSelected = selected.has(key)}

									<button
										type="button"
										aria-label={`${day.date} ${time}`}
										aria-pressed={isSelected}
										class={`h-10 border-b border-l border-slate-200 transition ${
											isSelected ? 'bg-green-500' : 'bg-white hover:bg-green-100'
										}`}
										onpointerdown={() => startDrag(day, time)}
										onpointerenter={() => continueDrag(day, time)}
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
						onclick={() => (joined = true)}
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
						<div
							class="border-b border-slate-200"
							style="display: grid; grid-template-columns: {gridColumns}"
						>
							<div></div>

							{#each days as day}
								<div class="border-l border-slate-200 px-1 pb-3 text-center">
									<div class="text-xs text-slate-500">{day.label}</div>
									<div class="mt-1 text-sm font-medium text-slate-900">{day.date}</div>
								</div>
							{/each}
						</div>

						<div style="display: grid; grid-template-columns: {gridColumns}">
							{#each times as time}
								<div class="flex h-10 items-center pr-2 text-[11px] text-slate-500">
									{time}
								</div>

								{#each days as day}
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