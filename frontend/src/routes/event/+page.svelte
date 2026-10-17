<script lang="ts">
	import { enhance } from '$app/forms';
	import Select from 'svelte-select';
	import { weekdayLabels, times, dateKey, rowLabel } from '$lib/calendar';
	import { createEventPresenter } from '$lib/presenters/event.presenter.svelte';
	import type { ActionData, PageData } from './$types';
	import { format, parseISO } from 'date-fns';
	import { resolve } from '$app/paths';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	const eventPresenter = createEventPresenter();
</script>

<svelte:window onpointerup={eventPresenter.stopDragging} />

<svelte:head>
	<title>New event | Meetly</title>
</svelte:head>

<section class="min-h-[calc(100vh-160px)] bg-slate-50 px-4 py-8 sm:px-6 dark:bg-slate-950">
	<div class="mx-auto max-w-6xl">
		<form
			method="POST"
			use:enhance={() => {
				eventPresenter.startSubmitting();
				return async ({ update }) => {
					try {
						await update();
					} finally {
						eventPresenter.finishSubmitting();
					}
				};
			}}
		>
			{#each [...eventPresenter.selectedDates] as date (date)}
				<input type="hidden" name="dates" value={date} />
			{/each}

			<div class="mb-8 text-center">
				<p class="text-sm font-medium text-slate-500 dark:text-slate-400">New event</p>

				<label class="sr-only" for="event-name">Event name</label>
				<input
					id="event-name"
					name="name"
					value={eventPresenter.eventName}
					oninput={(event) =>
						eventPresenter.setEventName((event.currentTarget as HTMLInputElement).value)}
					placeholder="Event name"
					class={`mt-2 w-full max-w-md rounded-lg border px-4 py-3 text-center text-xl font-medium text-slate-900 outline-none focus:border-green-500 dark:text-slate-100 ${eventPresenter.createButtonHovered && !eventPresenter.eventName.trim() ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
				/>
			</div>

			{#if form?.error}
				<p class="mb-4 text-center text-sm text-red-600 dark:text-red-400">{form.error}</p>
			{/if}

			<div class="grid gap-6 lg:grid-cols-2">
				<section
					class={`rounded-xl border bg-white p-4 sm:p-6 dark:bg-slate-900 ${eventPresenter.createButtonHovered && eventPresenter.selectedDates.size === 0 ? 'border-red-300 dark:border-red-800' : 'border-slate-200 dark:border-slate-800'}`}
				>
					<p class="text-xs font-medium tracking-wide text-slate-400 uppercase">Step 1</p>

					<div class="mt-1 flex items-center justify-between gap-3">
						<h2 class="font-medium text-slate-900 dark:text-slate-100">Choose some dates</h2>
						<div class="flex items-center gap-1">
							<button
								type="button"
								aria-label="Previous dates"
								class="flex h-7 w-7 items-center justify-center rounded border border-slate-200 font-bold text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
								disabled={eventPresenter.calendarStart <= eventPresenter.firstWeek}
								onclick={eventPresenter.previousDates}
							>
								&lt;
							</button>
							<button
								type="button"
								aria-label="Next dates"
								class="flex h-7 w-7 items-center justify-center rounded border border-slate-200 font-bold text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
								onclick={eventPresenter.nextDates}
							>
								&gt;
							</button>
						</div>
					</div>
					<p class="mt-1 text-xs text-slate-400">{eventPresenter.calendarLabel}</p>
					<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
						Click or drag to select the dates that work.
					</p>

					<div class="mt-5 overflow-x-auto">
						<div class="min-w-[380px]">
							<div class="grid grid-cols-[40px_repeat(7,1fr)_44px] gap-1 pb-1">
								<div></div>
								{#each weekdayLabels as label (label)}
									<div class="text-center text-xs font-medium text-slate-500 dark:text-slate-400">
										{label}
									</div>
								{/each}
								<div></div>
							</div>

							{#each eventPresenter.weeks as week (dateKey(week[0]))}
								<div class="grid grid-cols-[40px_repeat(7,1fr)_44px] items-center gap-1 py-0.5">
									<span class="text-xs text-slate-500 dark:text-slate-400">{rowLabel(week)}</span>

									{#each week as date (dateKey(date))}
										{@const key = dateKey(date)}
										{@const isSelected = eventPresenter.selectedDates.has(key)}
										{@const isToday = eventPresenter.isToday(key)}
										{@const isPast = eventPresenter.isPast(key)}
										{@const holiday = data.holidays[key]}

										<button
											type="button"
											aria-label={`${date.toLocaleDateString()}${holiday ? `: ${holiday}` : ''}`}
											title={holiday}
											aria-pressed={isSelected}
											disabled={isPast}
											class={`relative h-9 overflow-hidden rounded-md border text-sm transition ${
												isSelected
													? 'border-green-500 bg-green-500 text-white dark:border-green-600 dark:bg-green-600'
													: isPast
														? 'border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-600'
														: 'border-slate-200 bg-white text-slate-700 hover:bg-green-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
											} ${isToday ? 'font-semibold' : ''}`}
											class:cursor-not-allowed={isPast}
											onpointerdown={() => eventPresenter.startDateDrag(key)}
											onpointerenter={() => eventPresenter.dragOverDate(key)}
										>
											{#if holiday}
												<span
													class="pointer-events-none absolute top-0 right-0 h-2.5 w-2.5 rounded-bl-sm bg-yellow-400 dark:bg-yellow-500"
													aria-hidden="true"
												></span>
											{/if}
											{date.getDate()}
										</button>
									{/each}

									<span class="text-right text-xs text-slate-400">{week[6].getFullYear()}</span>
								</div>
							{/each}
						</div>
					</div>

					<div
						class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800"
					>
						<p class="text-xs text-slate-500 dark:text-slate-400">
							{eventPresenter.selectedDates.size} dates selected
						</p>

						<button
							type="button"
							class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
							onclick={eventPresenter.clearDates}
						>
							Clear
						</button>
					</div>
				</section>

				<section
					class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
				>
					<p class="text-xs font-medium tracking-wide text-slate-400 uppercase">Step 2</p>

					<h2 class="mt-1 font-medium text-slate-900 dark:text-slate-100">Set the time range</h2>
					<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
						Choose the hours people can mark as available.
					</p>

					<div class="mt-5 space-y-4">
						<label
							class="flex items-center justify-between gap-4 text-sm font-medium text-slate-700 dark:text-slate-300"
						>
							Start time
							<select
								name="startTime"
								value={eventPresenter.startTime}
								onchange={(event) =>
									eventPresenter.setStartTime((event.currentTarget as HTMLSelectElement).value)}
								class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
							>
								{#each times as time (time)}
									<option value={time}>{time}</option>
								{/each}
							</select>
						</label>

						<label
							class="flex items-center justify-between gap-4 text-sm font-medium text-slate-700 dark:text-slate-300"
						>
							End time
							<select
								name="endTime"
								value={eventPresenter.endTime}
								onchange={(event) =>
									eventPresenter.setEndTime((event.currentTarget as HTMLSelectElement).value)}
								class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
							>
								{#each times as time (time)}
									<option value={time}>{time}</option>
								{/each}
							</select>
						</label>

						<div
							class="font-small flex items-center justify-between gap-4 text-sm text-slate-700 dark:text-slate-300"
						>
							<label for="timezone-selector" class="font-medium">Time zone</label>
							<div class="relative min-w-0 flex-1">
								<Select
									id="timezone-selector"
									name="timezone"
									items={eventPresenter.timeZoneLabels}
									value={eventPresenter.timeZone}
									onchange={(event) => eventPresenter.setTimeZone(event.detail)}
									valueMode="id"
									itemId="zone"
									label="label"
									placeholder="Search time zones"
									clearable={false}
									class="w-full text-sm dark:[--background:#0f172a] dark:[--border-focused:1px_solid_#94a3b8] dark:[--border-hover:1px_solid_#475569] dark:[--border:1px_solid_#334155] dark:[--chevron-color:#94a3b8] dark:[--icons-color:#94a3b8] dark:[--input-color:#f1f5f9] dark:[--item-color:#f1f5f9] dark:[--item-hover-bg:#334155] dark:[--item-hover-color:#f1f5f9] dark:[--item-is-active-bg:#475569] dark:[--item-is-active-color:#f8fafc] dark:[--list-background:#1e293b] dark:[--list-border:1px_solid_#334155] dark:[--placeholder-color:#64748b] dark:[--selected-item-color:#f1f5f9]"
								/>
							</div>
						</div>
					</div>

					<div
						class="mt-8 flex items-center justify-end border-t border-slate-100 pt-4 dark:border-slate-800"
					>
						<div
							role="group"
							onmouseenter={() => eventPresenter.setCreateButtonHovered(true)}
							onmouseleave={() => eventPresenter.setCreateButtonHovered(false)}
						>
							<button
								type="submit"
								class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
								disabled={!eventPresenter.canCreate || eventPresenter.submitting}
							>
								{#if eventPresenter.submitting}
									<span
										class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent align-[-0.2em] dark:border-slate-900"
										role="status"
										aria-label="Creating event"
									></span>
									Creating...
								{:else}
									Create event
								{/if}
							</button>
						</div>
					</div>
				</section>
			</div>
		</form>

		<section class="mt-8">
			<h2 class="mb-3 text-center font-medium text-slate-900 dark:text-slate-100">Your events</h2>

			{#if data.events.length === 0}
				<p class="text-center text-sm text-slate-500 dark:text-slate-400">
					You haven't created any events yet.
				</p>
			{:else}
				<ul class="mx-auto max-w-2xl space-y-2">
					{#each data.events as event (event.id)}
						{@const dates = [...event.dates].sort()}
						{@const first = dates[0] ? format(parseISO(dates[0]), 'd MMM yyyy') : undefined}
						{@const last =
							dates.length > 1
								? format(parseISO(dates[dates.length - 1]), 'd MMM yyyy')
								: undefined}

						<li>
							<a
								href={resolve(`/event/${event.id}`)}
								class="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-green-500 hover:bg-green-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-green-600 dark:hover:bg-slate-800"
							>
								<span class="min-w-0">
									<span class="block truncate font-medium text-slate-900 dark:text-slate-100">
										{event.name}
									</span>

									<span class="block text-xs text-slate-500 dark:text-slate-400">
										{event.dates.length}
										{event.dates.length === 1 ? 'date' : 'dates'}
										{first}
										{#if last && first !== last}
											- {last}
										{/if}
									</span>
								</span>

								<span class="text-slate-400" aria-hidden="true">&rarr;</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</section>
