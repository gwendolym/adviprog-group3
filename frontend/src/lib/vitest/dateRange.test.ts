import { describe, expect, it } from 'vitest';
import { formatDateRange } from '../dateRange';

describe('formatDateRange', () => {
	it('shows a single date once', () => {
		expect(formatDateRange(['2026-10-26T00:00:00.000Z'])).toBe('26 Oct 2026');
	});

	it('shows the first and last of several dates, whatever their order', () => {
		expect(
			formatDateRange([
				'2026-11-03T00:00:00.000Z',
				'2026-10-26T00:00:00.000Z',
				'2026-10-28T00:00:00.000Z'
			])
		).toBe('26 Oct 2026 - 3 Nov 2026');
	});
});
