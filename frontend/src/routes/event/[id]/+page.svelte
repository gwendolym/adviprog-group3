<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { cellKey } from '$lib/availability';
	import { createAvailabilityPresenter } from '$lib/presenters/availability.presenter.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props(); // Svelte updates route props through this binding.
	const availability = createAvailabilityPresenter(page.params.id ?? '');

	const event = $derived(data.event);
	const times = $derived(data.times);
	const days = $derived(data.days);
	const gridColumns = $derived(data.gridColumns);
	const gridMinWidth = $derived(data.gridMinWidth);

	onMount(function initializeSocket() {
		return availability.initialize();
	});
</script>

{#snippet gridHeader()}
	<div
		class="border-b border-slate-200 dark:border-slate-800"
		style="display: grid; grid-template-columns: {gridColumns}"
	>
		<div></div>

		{#each days as day (day.date)}
			<div class="border-l border-slate-200 px-1 pb-3 text-center dark:border-slate-800">
				<div class="text-xs text-slate-500 dark:text-slate-400">{day.label}</div>
				<div class="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{day.date}</div>
			</div>
		{/each}
	</div>
{/snippet}

<svelte:window onpointerup={availability.stopDragging} />

<svelte:head>
	<title>{event.name} | Meetly</title>
</svelte:head>

<section class="min-h-[calc(100vh-160px)] bg-slate-50 px-4 py-8 sm:px-6 dark:bg-slate-950">
	<div class="mx-auto max-w-6xl">
		<div class="mb-8 flex flex-wrap items-end justify-between gap-4">
			<div>
				<p class="text-sm font-medium text-slate-500 dark:text-slate-400">Meeting availability</p>
				<h1 class="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
					{event.name}
				</h1>
				<p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
					{event.startTime} - {event.endTime} ({event.timezone})
				</p>
			</div>

			<button
				type="button"
				class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
				onclick={availability.copyLink}
			>
				{availability.copied ? 'Copied' : 'Copy link'}
			</button>
		</div>

		<div class="grid gap-6 lg:grid-cols-2">
			<section
				class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
			>
				<div class="mb-5 flex flex-wrap items-start justify-between gap-3">
					<div>
						<p
							class="text-xs font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500"
						>
							Step 1
						</p>
						<h2 class="mt-1 font-medium text-slate-900 dark:text-slate-100">Your availability</h2>
						<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
							Enter your name and select the times that work for you.
						</p>
					</div>

					<span
						class="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-300"
					>
						{availability.selectedCells.size} selected
					</span>
				</div>

				<div class="flex items-end gap-3">
					<label
						class="min-w-0 flex-1 text-sm font-medium text-slate-700 dark:text-slate-300"
						for="name"
					>
						Your name
						<input
							id="name"
							value={availability.participantName}
							oninput={(event) =>
								availability.setParticipantName((event.currentTarget as HTMLInputElement).value)}
							class={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-green-500 dark:bg-slate-800 dark:text-slate-100 ${!availability.joined && availability.availabilityHovered ? 'border-red-300 bg-red-50 dark:border-red-500/50 dark:bg-red-950/40' : 'border-slate-200 dark:border-slate-700'}`}
						/>
					</label>

					<button
						type="button"
						class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-slate-500"
						disabled={!availability.canJoin}
						onclick={availability.join}
					>
						{availability.joined ? 'Logout' : 'Login'}
					</button>
				</div>

				<div class="mt-5 overflow-x-auto">
					<div style="min-width: {gridMinWidth}">
						{@render gridHeader()}

						<div class="select-none" style="display: grid; grid-template-columns: {gridColumns}">
							{#each times as time (time)}
								<div
									class="flex h-10 items-center pr-2 text-[11px] text-slate-500 dark:text-slate-400"
								>
									{time}
								</div>

								{#each days as day (day.date)}
									{@const isSelected = availability.selectedCells.has(cellKey(day, time))}

									<button
										type="button"
										data-key={cellKey(day, time)}
										aria-label={`${day.date} ${time}`}
										aria-pressed={isSelected}
										class={`h-10 border-b border-l border-slate-200 transition dark:border-slate-800 ${
											isSelected
												? 'bg-green-500'
												: 'bg-white hover:bg-green-100 dark:bg-slate-900 dark:hover:bg-green-900/40'
										}`}
										onpointerdown={availability.startCellDrag}
										onpointerenter={availability.dragOverCell}
										onpointerleave={availability.leaveCell}
									></button>
								{/each}
							{/each}
						</div>
					</div>
				</div>

				<div
					class="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400"
				>
					<p class="text-xs text-slate-500 dark:text-slate-400">
						Click or drag to select your availability.
					</p>
				</div>
			</section>

			<section
				class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
			>
				<div class="mb-5 flex flex-wrap items-start justify-between gap-3">
					<div>
						<p
							class="text-xs font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500"
						>
							Step 2
						</p>
						<h2 class="mt-1 font-medium text-slate-900 dark:text-slate-100">Team availability</h2>
						<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
							See when everyone is available.
						</p>
					</div>

					<span class="text-sm text-slate-500 dark:text-slate-400">
						{availability.participantCount}
						{availability.participantCount === 1 ? 'participant' : 'participants'}
					</span>
				</div>

				<div class="overflow-x-auto">
					<div style="min-width: {gridMinWidth}">
						{@render gridHeader()}

						<div style="display: grid; grid-template-columns: {gridColumns}">
							{#each times as time (time)}
								<div
									class="flex h-10 items-center pr-2 text-[11px] text-slate-500 dark:text-slate-400"
								>
									{time}
								</div>

								{#each days as day (day.date)}
									{@const count = availability.availableCount(day, time)}

									<div
										role="gridcell"
										tabindex="-1"
										data-key={cellKey(day, time)}
										class={`flex h-10 items-center justify-center border-b border-l border-slate-200 text-xs font-medium transition dark:border-slate-800 ${availability.availabilityClass(count)}`}
										onmouseenter={availability.setHoveredAvailability}
										onmouseleave={availability.clearHoveredAvailability}
									>
										{count > 0 ? `${count}/${availability.participantCount}` : ''}
									</div>
								{/each}
							{/each}
						</div>
					</div>
				</div>

				<div
					class="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400"
				>
					<span class="flex items-center gap-2">
						<span class="h-3 w-3 rounded-sm bg-red-100 dark:bg-red-900/60"></span>
						Unavailable
					</span>

					<span class="flex items-center gap-2">
						<span class="h-3 w-3 rounded-sm bg-green-700"></span>
						Available
					</span>
				</div>

				<div class="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
					<h3 class="text-sm font-medium text-slate-900 dark:text-slate-100">Team members</h3>

					{#if availability.participantCount === 0}
						<p class="mt-2 text-sm text-slate-500 dark:text-slate-400">No one has joined yet.</p>
					{:else}
						<ul
							class="mt-2 divide-y divide-slate-100 text-sm text-slate-600 dark:divide-slate-800 dark:text-slate-400"
						>
							{#each Object.keys(availability.participants).sort() as name (name)}
								<li
									class={`min-w-0 rounded px-2 py-2 ${
										availability.isAvailableOnHoveredCell(name)
											? 'rounded bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300'
											: ''
									}`}
								>
									<span class="block truncate" title={name}>{name}</span>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</section>
		</div>
	</div>
</section>
