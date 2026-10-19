import { format, parseISO } from 'date-fns';

const formatDay = (date: string) => format(parseISO(date), 'd MMM yyyy');

// Formats event dates as "26 Oct 2026" or, for several dates, "26 Oct 2026 - 3 Nov 2026"
export function formatDateRange(dates: string[]) {
	if (dates.length === 0) return '';

	const sorted = [...dates].sort();
	const first = formatDay(sorted[0]);
	const last = formatDay(sorted[sorted.length - 1]);

	return first === last ? first : `${first} - ${last}`;
}
