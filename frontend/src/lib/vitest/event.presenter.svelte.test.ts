import { addDays, addWeeks, startOfWeek } from 'date-fns';
import { describe, expect, it } from 'vitest';
import { dateKey } from '$lib/calendar';
import { createEventPresenter } from '$lib/presenters/event.presenter.svelte';

const today = new Date();
const todayKey = dateKey(today);
const tomorrowKey = dateKey(addDays(today, 1));
const yesterdayKey = dateKey(addDays(today, -1));

describe('event presenter', () => {
	it('can only create once there is a name, a date and a valid time range', () => {
		const presenter = createEventPresenter();
		expect(presenter.canCreate).toBe(false);

		presenter.setEventName('   ');
		presenter.startDateDrag(todayKey);
		expect(presenter.canCreate).toBe(false);

		presenter.setEventName('Standup');
		expect(presenter.canCreate).toBe(true);

		presenter.setStartTime('17:00');
		presenter.setEndTime('09:00');
		expect(presenter.canCreate).toBe(false);
	});

	it('selects dates by dragging and ignores past dates', () => {
		const presenter = createEventPresenter();

		presenter.startDateDrag(todayKey);
		presenter.dragOverDate(yesterdayKey);
		presenter.dragOverDate(tomorrowKey);
		presenter.stopDragging();

		expect([...presenter.selectedDates].sort()).toEqual([todayKey, tomorrowKey]);
	});

	it('does not start a drag on a past date', () => {
		const presenter = createEventPresenter();

		presenter.startDateDrag(yesterdayKey);
		presenter.dragOverDate(todayKey);

		expect(presenter.selectedDates.size).toBe(0);
	});

	it('removes dates when the drag starts on a selected date', () => {
		const presenter = createEventPresenter();
		presenter.startDateDrag(todayKey);
		presenter.dragOverDate(tomorrowKey);
		presenter.stopDragging();

		presenter.startDateDrag(todayKey);
		presenter.dragOverDate(tomorrowKey);

		expect(presenter.selectedDates.size).toBe(0);
	});

	it('ignores hovering when no drag is active', () => {
		const presenter = createEventPresenter();

		presenter.dragOverDate(todayKey);

		expect(presenter.selectedDates.size).toBe(0);
	});

	it('clears all dates', () => {
		const presenter = createEventPresenter();
		presenter.startDateDrag(todayKey);

		presenter.clearDates();

		expect(presenter.selectedDates.size).toBe(0);
	});

	it('pages the calendar by five weeks but never before the current week', () => {
		const presenter = createEventPresenter();
		const firstWeek = startOfWeek(today, { weekStartsOn: 1 });
		expect(presenter.weeks).toHaveLength(5);

		presenter.previousDates();
		expect(dateKey(presenter.calendarStart)).toBe(dateKey(firstWeek));

		presenter.nextDates();
		expect(dateKey(presenter.calendarStart)).toBe(dateKey(addWeeks(firstWeek, 5)));
		expect(dateKey(presenter.weeks[0][0])).toBe(dateKey(addWeeks(firstWeek, 5)));

		presenter.previousDates();
		expect(dateKey(presenter.calendarStart)).toBe(dateKey(firstWeek));
	});

	it('tells past and current dates apart', () => {
		const presenter = createEventPresenter();

		expect(presenter.isPast(yesterdayKey)).toBe(true);
		expect(presenter.isPast(todayKey)).toBe(false);
		expect(presenter.isToday(todayKey)).toBe(true);
		expect(presenter.isToday(tomorrowKey)).toBe(false);
	});

	it('labels time zones with their UTC offset', () => {
		const presenter = createEventPresenter();
		const tokyo = presenter.timeZoneLabels.find((zone) => zone.zone === 'Asia/Tokyo');

		expect(tokyo).toEqual({ zone: 'Asia/Tokyo', city: 'Tokyo', label: '(GMT +9:00) Tokyo' });
	});
});
