import { SvelteDate, SvelteSet } from 'svelte/reactivity';
import { addWeeks, format, startOfWeek } from 'date-fns';
import { timeZones, dateKey, buildWeeksFrom } from '$lib/calendar';

export function createEventPresenter() {
	const todayKey = dateKey(new SvelteDate());
	const firstWeek = startOfWeek(new SvelteDate(), { weekStartsOn: 1 });
	let calendarStart = $state(firstWeek); // Reactive calendar state must be mutable.
	const weeks = $derived(buildWeeksFrom(calendarStart, 5));
	const calendarLabel = $derived(format(calendarStart, 'MMMM yyyy'));

	let eventName = $state(''); // Reactive form state must be mutable.
	let startTime = $state('09:00'); // Reactive form state must be mutable.
	let endTime = $state('17:00'); // Reactive form state must be mutable.
	let timeZone = $state('Europe/Stockholm'); // Reactive form state must be mutable.
	const selectedDates = new SvelteSet<string>();
	let dragging = $state(false); // Reactive pointer state must be mutable.
	let dragMode = $state<'add' | 'remove'>('add'); // Reactive pointer state must be mutable.
	let createButtonHovered = $state(false); // Reactive hover state must be mutable.

	const timeZoneOptions =
		(
			Intl as typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] }
		).supportedValuesOf?.('timeZone') ?? timeZones;

	const timeZoneLabels = timeZoneOptions.map((zone) => {
		const offset =
			new Intl.DateTimeFormat('en', { timeZone: zone, timeZoneName: 'longOffset' })
				.formatToParts(new SvelteDate())
				.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
		const offsetLabel =
			offset === 'GMT'
				? 'GMT +0:00'
				: offset
						.replace(/GMT([+-])(\d{2}):(\d{2})/, 'GMT $1$2:$3')
						.replace(/([+-])0(\d):/, '$1$2:');
		const city = zone.split('/').at(-1)?.replaceAll('_', ' ') ?? zone;
		return { zone, city, label: `(${offsetLabel}) ${city}` };
	});

	const canCreate = $derived(
		eventName.trim().length > 0 && selectedDates.size > 0 && startTime < endTime
	);

	function applyDragMode(key: string) {
		// Set mutation preserves the selected-date interaction state.
		if (dragMode === 'add') selectedDates.add(key);
		else selectedDates.delete(key);
	}

	return {
		get calendarStart() {
			return calendarStart;
		},
		get firstWeek() {
			return firstWeek;
		},
		get weeks() {
			return weeks;
		},
		get calendarLabel() {
			return calendarLabel;
		},
		get eventName() {
			return eventName;
		},
		get startTime() {
			return startTime;
		},
		get endTime() {
			return endTime;
		},
		get timeZone() {
			return timeZone;
		},
		get timeZoneLabels() {
			return timeZoneLabels;
		},
		get selectedDates() {
			return selectedDates;
		},
		get canCreate() {
			return canCreate;
		},
		get createButtonHovered() {
			return createButtonHovered;
		},
		setEventName(name: string) {
			eventName = name;
		},
		setStartTime(value: string) {
			startTime = value;
		},
		setEndTime(value: string) {
			endTime = value;
		},
		setTimeZone(value: string) {
			timeZone = value;
		},
		isPast(key: string) {
			return key < todayKey;
		},
		isToday(key: string) {
			return key === todayKey;
		},
		startDateDrag(key: string) {
			if (key < todayKey) return;
			dragMode = selectedDates.has(key) ? 'remove' : 'add';
			dragging = true;
			applyDragMode(key);
		},
		dragOverDate(key: string) {
			if (dragging && key >= todayKey) applyDragMode(key);
		},
		clearDates() {
			// Set mutation clears the selected-date interaction state.
			selectedDates.clear();
		},
		previousDates() {
			if (calendarStart > firstWeek) calendarStart = addWeeks(calendarStart, -5);
		},
		nextDates() {
			calendarStart = addWeeks(calendarStart, 5);
		},
		setCreateButtonHovered(value: boolean) {
			createButtonHovered = value;
		},
		stopDragging() {
			dragging = false;
		}
	};
}
