<script lang="ts">
	import { enhance } from '$app/forms';
	import Select from 'svelte-select';
	import { weekdayLabels, times, dateKey, rowLabel } from '$lib/calendar';
	import { createEventPresenter } from '$lib/presenters/event.presenter.svelte';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props(); // Svelte updates form props.
	const eventPresenter = createEventPresenter();
</script>

<svelte:window onpointerup={eventPresenter.stopDragging} />

<svelte:head>
	<title>New event | Meetly</title>
</svelte:head>

<section class="min-h-[calc(100vh-160px)] bg-slate-50 px-4 py-8 sm:px-6">
	<div class="mx-auto max-w-6xl">
		<form method="POST" use:enhance>
			{#each [...eventPresenter.selectedDates] as date (date)}
				<input type="hidden" name="dates" value={date} />
			{/each}

			<div class="mb-8 text-center">
				<p class="text-sm font-medium text-slate-500">New event</p>

				<label class="sr-only" for="event-name">Event name</label>
				<input
					id="event-name"
					name="name"
					value={eventPresenter.eventName}
					oninput={(event) =>
						eventPresenter.setEventName((event.currentTarget as HTMLInputElement).value)}
					placeholder="Event name"
					class={`mt-2 w-full max-w-md rounded-lg border px-4 py-3 text-center text-xl font-medium text-slate-900 outline-none focus:border-green-500 ${eventPresenter.createButtonHovered && !eventPresenter.eventName.trim() ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
				/>
			</div>

			{#if form?.error}
				<p class="mb-4 text-center text-sm text-red-600">{form.error}</p>
			{/if}

			<div class="grid gap-6 lg:grid-cols-2">
				<section
					class={`rounded-xl border bg-white p-4 sm:p-6 ${eventPresenter.createButtonHovered && eventPresenter.selectedDates.size === 0 ? 'border-red-300' : 'border-slate-200'}`}
				>
					<p class="text-xs font-medium tracking-wide text-slate-400 uppercase">Step 1</p>

					<div class="mt-1 flex items-center justify-between gap-3">
						<h2 class="font-medium text-slate-900">Choose some dates</h2>
						<div class="flex items-center gap-1">
							<button
								type="button"
								aria-label="Previous dates"
								class="flex h-7 w-7 items-center justify-center rounded border border-slate-200 font-bold text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
								disabled={eventPresenter.calendarStart <= eventPresenter.firstWeek}
								onclick={eventPresenter.previousDates}
							>
								&lt;
							</button>
							<button
								type="button"
								aria-label="Next dates"
								class="flex h-7 w-7 items-center justify-center rounded border border-slate-200 font-bold text-slate-500 hover:bg-slate-100"
								onclick={eventPresenter.nextDates}
							>
								&gt;
							</button>
						</div>
					</div>
					<p class="mt-1 text-xs text-slate-400">{eventPresenter.calendarLabel}</p>
					<p class="mt-1 text-sm text-slate-500">Click or drag to select the dates that work.</p>

					<div class="mt-5 overflow-x-auto">
						<div class="min-w-[380px]">
							<div class="grid grid-cols-[40px_repeat(7,1fr)_44px] gap-1 pb-1">
								<div></div>
								{#each weekdayLabels as label (label)}
									<div class="text-center text-xs font-medium text-slate-500">{label}</div>
								{/each}
								<div></div>
							</div>

							{#each eventPresenter.weeks as week (dateKey(week[0]))}
								<div class="grid grid-cols-[40px_repeat(7,1fr)_44px] items-center gap-1 py-0.5">
									<span class="text-xs text-slate-500">{rowLabel(week)}</span>

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
													? 'border-green-500 bg-green-500 text-white'
													: isPast
														? 'border-slate-200 bg-slate-100 text-slate-400'
														: 'border-slate-200 bg-white text-slate-700 hover:bg-green-50'
											} ${isToday ? 'font-semibold' : ''}`}
											class:cursor-not-allowed={isPast}
											onpointerdown={() => eventPresenter.startDateDrag(key)}
											onpointerenter={() => eventPresenter.dragOverDate(key)}
										>
											{#if holiday}
												<span
													class="pointer-events-none absolute top-0 right-0 h-2.5 w-2.5 rounded-bl-sm bg-yellow-400"
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

					<div class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
						<p class="text-xs text-slate-500">{eventPresenter.selectedDates.size} dates selected</p>

						<button
							type="button"
							class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
							onclick={eventPresenter.clearDates}
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
								value={eventPresenter.startTime}
								onchange={(event) =>
									eventPresenter.setStartTime((event.currentTarget as HTMLSelectElement).value)}
								class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
							>
								{#each times as time (time)}
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
								value={eventPresenter.endTime}
								onchange={(event) =>
									eventPresenter.setEndTime((event.currentTarget as HTMLSelectElement).value)}
								class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
							>
								{#each times as time (time)}
									<option value={time}>{time}</option>
								{/each}
							</select>
						</label>

						<div class="font-small flex items-center justify-between gap-4 text-sm text-slate-700">
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
									class="w-full text-sm"
									containerStyles="border: 1px solid #e2e8f0; border-radius: 0.5rem; background: white;"
								/>
							</div>
						</div>
					</div>

					<div class="mt-8 flex items-center justify-end border-t border-slate-100 pt-4">
						<div
							role="group"
							onmouseenter={() => eventPresenter.setCreateButtonHovered(true)}
							onmouseleave={() => eventPresenter.setCreateButtonHovered(false)}
						>
							<button
								type="submit"
								class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
								disabled={!eventPresenter.canCreate}
							>
								Create event
							</button>
						</div>
					</div>
				</section>
			</div>
		</form>
	</div>
</section>
