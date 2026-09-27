<script lang="ts">
	import { enhance } from '$app/forms';
	import { SvelteSet } from 'svelte/reactivity';
	import { weekdayLabels, timeZones, times, dateKey, buildWeeks, rowLabel } from './calendar';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const todayKey = dateKey(new Date());
	const weeks = buildWeeks(5);

	let eventName = $state('');
	let startTime = $state('09:00');
	let endTime = $state('17:00');
	let timeZone = $state('Europe/Stockholm');

	const selectedDates = new SvelteSet<string>();
	let dragging = $state(false);
	let dragMode: 'add' | 'remove' = 'add';

	function startDrag(key: string) {
		dragMode = selectedDates.has(key) ? 'remove' : 'add';
		dragging = true;
		toggle(key);
	}

	function continueDrag(key: string) {
		if (dragging) toggle(key);
	}

	function toggle(key: string) {
		if (dragMode === 'add') selectedDates.add(key);
		else selectedDates.delete(key);
	}

	const canCreate = $derived(
		eventName.trim().length > 0 && selectedDates.size > 0 && startTime < endTime
	);
</script>

<svelte:window onpointerup={() => (dragging = false)} />

<svelte:head>
	<title>New event | Meetly</title>
</svelte:head>

<section class="min-h-[calc(100vh-160px)] bg-slate-50 px-4 py-8 sm:px-6">
	<div class="mx-auto max-w-6xl">
		<form method="POST" use:enhance>
			{#each [...selectedDates] as date}
				<input type="hidden" name="dates" value={date} />
			{/each}

			<div class="mb-8 text-center">
				<p class="text-sm font-medium text-slate-500">New event</p>

				<input
					name="name"
					bind:value={eventName}
					placeholder="Event name"
					class="mt-2 w-full max-w-md rounded-lg border border-slate-200 px-4 py-3 text-center text-xl font-medium text-slate-900 outline-none focus:border-green-500"
				/>
			</div>

			{#if form?.error}
				<p class="mb-4 text-center text-sm text-red-600">{form.error}</p>
			{/if}

			<div class="grid gap-6 lg:grid-cols-2">
				<section class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
					<p class="text-xs font-medium tracking-wide text-slate-400 uppercase">Step 1</p>

					<h2 class="mt-1 font-medium text-slate-900">Choose some dates</h2>
					<p class="mt-1 text-sm text-slate-500">Click or drag to select the dates that work.</p>

					<div class="mt-5 overflow-x-auto">
						<div class="min-w-[380px]">
							<div class="grid grid-cols-[40px_repeat(7,1fr)_44px] gap-1 pb-1">
								<div></div>
								{#each weekdayLabels as label}
									<div class="text-center text-xs font-medium text-slate-500">{label}</div>
								{/each}
								<div></div>
							</div>

							{#each weeks as week}
								<div class="grid grid-cols-[40px_repeat(7,1fr)_44px] items-center gap-1 py-0.5">
									<span class="text-xs text-slate-500">{rowLabel(week)}</span>

									{#each week as date}
										{@const key = dateKey(date)}
										{@const isSelected = selectedDates.has(key)}
										{@const isToday = key === todayKey}

										<button
											type="button"
											aria-label={date.toLocaleDateString()}
											aria-pressed={isSelected}
											class={`h-9 rounded-md border text-sm transition ${
												isSelected
													? 'border-green-500 bg-green-500 text-white'
													: 'border-slate-200 bg-white text-slate-700 hover:bg-green-50'
											} ${isToday ? 'font-semibold' : ''}`}
											onpointerdown={() => startDrag(key)}
											onpointerenter={() => continueDrag(key)}
										>
											{date.getDate()}
										</button>
									{/each}

									<span class="text-right text-xs text-slate-400">{week[6].getFullYear()}</span>
								</div>
							{/each}
						</div>
					</div>

					<div class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
						<p class="text-xs text-slate-500">{selectedDates.size} dates selected</p>

						<button
							type="button"
							class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
							onclick={() => selectedDates.clear()}
						>
							Clear
						</button>
					</div>
				</section>

				<section class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
					<p class="text-xs font-medium tracking-wide text-slate-400 uppercase">Step 2</p>

					<h2 class="mt-1 font-medium text-slate-900">Set the time range</h2>
					<p class="mt-1 text-sm text-slate-500">Choose the hours people can mark as available.</p>

					<div class="mt-5 space-y-4">
						<label
							class="flex items-center justify-between gap-4 text-sm font-medium text-slate-700"
						>
							Start time
							<select
								name="startTime"
								bind:value={startTime}
								class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
							>
								{#each times as time}
									<option value={time}>{time}</option>
								{/each}
							</select>
						</label>

						<label
							class="flex items-center justify-between gap-4 text-sm font-medium text-slate-700"
						>
							End time
							<select
								name="endTime"
								bind:value={endTime}
								class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
							>
								{#each times as time}
									<option value={time}>{time}</option>
								{/each}
							</select>
						</label>

						<label
							class="flex items-center justify-between gap-4 text-sm font-medium text-slate-700"
						>
							Time zone
							<select
								name="timezone"
								bind:value={timeZone}
								class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
							>
								{#each timeZones as zone}
									<option value={zone}>{zone}</option>
								{/each}
							</select>
						</label>
					</div>

					<div class="mt-8 flex items-center justify-end border-t border-slate-100 pt-4">
						<button
							type="submit"
							class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
							disabled={!canCreate}
						>
							Create event
						</button>
					</div>
				</section>
			</div>
		</form>
	</div>
</section>