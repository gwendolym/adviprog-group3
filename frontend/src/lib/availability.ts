import { format, parseISO } from 'date-fns';

export type Day = { label: string; date: string };

const TIME_COLUMN_WIDTH = 66;
const DAY_COLUMN_MIN_WIDTH = 90;

function hourOf(label: string) {
	return Number(label.slice(0, 2));
}

function labelOf(hour: number) {
	return `${String(hour).padStart(2, '0')}:00`;
}

// Supports ranges that cross midnight, e.g. 22:00 - 02:00.
export function buildTimes(startTime: string, endTime: string): string[] {
	const start = hourOf(startTime);
	const end = hourOf(endTime);
	const hourCount = (end >= start ? end - start : end + 24 - start) + 1;

	return Array.from({ length: hourCount }, (_, i) => labelOf((start + i) % 24));
}

export function buildDays(dates: string[]): Day[] {
	return dates.map((date) => {
		const parsedDate = parseISO(date);
		return {
			label: format(parsedDate, 'EEE'),
			date: format(parsedDate, 'MMM d')
		};
	});
}

export function cellKey(day: Day, time: string) {
	return `${day.date}-${time}`;
}

export function buildGridColumns(dayCount: number) {
	return `${TIME_COLUMN_WIDTH}px repeat(${dayCount}, minmax(0, 1fr))`;
}

export function buildGridMinWidth(dayCount: number) {
	return `${TIME_COLUMN_WIDTH + dayCount * DAY_COLUMN_MIN_WIDTH}px`;
}
