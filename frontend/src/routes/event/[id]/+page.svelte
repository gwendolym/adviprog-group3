<script lang="ts">
	import { page } from '$app/state';
	import { SvelteSet } from 'svelte/reactivity';

	type Day = { label: string; date: string };

	"Mock data. This data will come from a backend API."
	const times = [
		'9:00 AM',
		'10:00 AM',
		'11:00 AM',
		'12:00 PM',
		'1:00 PM',
		'2:00 PM',
		'3:00 PM',
		'4:00 PM',
		'5:00 PM'
	];

	"Mock data. This data will come from a backend API."
	const days: Day[] = [
		{ label: 'Tue', date: 'Oct 6' },
		{ label: 'Wed', date: 'Oct 7' },
		{ label: 'Thu', date: 'Oct 8' }
	];

	"Mock data. This data will come from a backend API."
	const teamSlots = new Map<string, number>();
	const totalParticipants = 1;

	let participantName = $state('');
	let selected = new SvelteSet<string>();
	let copied = $state(false);
	let joined = $state(false);
	let dragging = $state(false);
	let dragMode: 'add' | 'remove' = 'add';

	const eventName = $derived(page.params.id === 'test' ? 'test' : `Event ${page.params.id}`);
	const eventUrl = $derived(typeof window === 'undefined' ? '' : window.location.href);
	const selectedCount = $derived(selected.size);
	const canJoin = $derived(participantName.trim().length > 0);

	function cellKey(day: Day, time: string) {
		return `${day.date}-${time}`;
	}

	function applyDrag(key: string) {
		if (dragMode === 'add') selected.add(key);
		else selected.delete(key);
	}

	function startDrag(day: Day, time: string) {
		const key = cellKey(day, time);
		dragMode = selected.has(key) ? 'remove' : 'add';
		dragging = true;
		applyDrag(key);
	}

	function continueDrag(day: Day, time: string) {
		if (dragging) applyDrag(cellKey(day, time));
	}

	function copyLink() {
		if (eventUrl) navigator.clipboard?.writeText(eventUrl);

		copied = true;
		setTimeout(() => (copied = false), 1600);
	}

	function teamCount(day: Day, time: string) {
		const key = cellKey(day, time);
		const others = teamSlots.get(key) ?? 0;
		const mine = joined && selected.has(key) ? 1 : 0;

		return Math.min(others + mine, totalParticipants);
	}

	function heatClasses(count: number) {
		if (count >= totalParticipants) return 'bg-green-700 text-white';
		if (count === 2) return 'bg-green-400 text-green-950';
		if (count === 1) return 'bg-green-200 text-green-950';
		return 'bg-red-100 text-red-300';
	}
</script>

<svelte:window onpointerup={() => (dragging = false)} />

<svelte:head>
	<title>{eventName} | Meetly</title>
</svelte:head>

<section class="min-h-[calc(100vh-160px)] bg-slate-50 px-4 py-8 sm:px-6">
	<div class="mx-auto max-w-6xl">
		<div class="mb-8 flex flex-wrap items-end justify-between gap-4">
			<div>
				<p class="text-sm font-medium text-slate-500">Meeting availability</p>
				<h1 class="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{eventName}</h1>
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
						{selectedCount} selected
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
					<div class="min-w-[440px]">
						<div class="grid grid-cols-[66px_repeat(3,minmax(0,1fr))] border-b border-slate-200">
							<div></div>

							{#each days as day}
								<div class="border-l border-slate-200 px-1 pb-3 text-center">
									<div class="text-xs text-slate-500">{day.label}</div>
									<div class="mt-1 text-sm font-medium text-slate-900">{day.date}</div>
								</div>
							{/each}
						</div>

						<div class="grid grid-cols-[66px_repeat(3,minmax(0,1fr))] select-none">
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

					<span class="text-sm text-slate-500">{totalParticipants} participant</span>
				</div>

				<div class="overflow-x-auto">
					<div class="min-w-[440px]">
						<div class="grid grid-cols-[66px_repeat(3,minmax(0,1fr))] border-b border-slate-200">
							<div></div>

							{#each days as day}
								<div class="border-l border-slate-200 px-1 pb-3 text-center">
									<div class="text-xs text-slate-500">{day.label}</div>
									<div class="mt-1 text-sm font-medium text-slate-900">{day.date}</div>
								</div>
							{/each}
						</div>

						<div class="grid grid-cols-[66px_repeat(3,minmax(0,1fr))]">
							{#each times as time}
								<div class="flex h-10 items-center pr-2 text-[11px] text-slate-500">
									{time}
								</div>

								{#each days as day}
									{@const count = teamCount(day, time)}

									<div
										class={`flex h-10 items-center justify-center border-b border-l border-slate-200 text-xs font-medium transition ${heatClasses(count)}`}
									>
										{count > 0 ? `${count}/${totalParticipants}` : ''}
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
						<span class="h-3 w-3 rounded-sm bg-green-200"></span>
						1 available
					</span>

					<span class="flex items-center gap-2">
						<span class="h-3 w-3 rounded-sm bg-green-400"></span>
						2 available
					</span>

					<span class="flex items-center gap-2">
						<span class="h-3 w-3 rounded-sm bg-green-700"></span>
						Everyone available
					</span>
				</div>
			</section>
		</div>
	</div>
</section>
