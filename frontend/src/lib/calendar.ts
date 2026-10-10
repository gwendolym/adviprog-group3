import { startOfWeek, addDays, format } from 'date-fns';

export const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const timeZones = ['Europe/Stockholm', 'Europe/London', 'America/New_York', 'Asia/Tokyo'];

function formatHour(_value: undefined, hour: number) {
	return `${String(hour).padStart(2, '0')}:00`;
}

export const times = Array.from({ length: 24 }, formatHour);

export function dateKey(date: Date): string {
	return format(date, 'yyyy-MM-dd');
}

// Builds a grid of weekCount weeks, starting from the week that contains today.
export function buildWeeks(weekCount: number): Date[][] {
	return buildWeeksFrom(startOfWeek(new Date(), { weekStartsOn: 1 }), weekCount);
}

export function buildWeeksFrom(weekStart: Date, weekCount: number): Date[][] {
	return Array.from({ length: weekCount }, (_, week) =>
		Array.from({ length: 7 }, (_, day) => addDays(weekStart, week * 7 + day))
	);
}

export function rowLabel(week: Date[]): string {
	const first = format(week[0], 'MMM').toLowerCase();
	const last = format(week[6], 'MMM').toLowerCase();
	return first === last ? first : `${first}/${last}`;
}
