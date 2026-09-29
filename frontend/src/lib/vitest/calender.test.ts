import { describe, expect, it, vi } from 'vitest';
import { buildWeeks, dateKey, rowLabel, timeZones, times } from '../calendar';

describe('calendar', () => {
	it('contains 24 hourly time slots', () => {
		expect(times).toHaveLength(24);
		expect(times[0]).toBe('00:00');
		expect(times[23]).toBe('23:00');
	});

	it('contains valid time zones', () => {
		timeZones.forEach((timeZone) => {
			expect(() => new Intl.DateTimeFormat('en-US', { timeZone })).not.toThrow();
		});
	});

	it('formats dates as yyyy-MM-dd', () => {
		expect(dateKey(new Date(2026, 8, 5))).toBe('2026-09-05');
	});

	it('builds weeks starting on Sunday', () => {
		vi.setSystemTime(new Date(2026, 8, 30));

		const weeks = buildWeeks(2);

		expect(weeks).toHaveLength(2);
		expect(weeks[0]).toHaveLength(7);
		expect(dateKey(weeks[0][0])).toBe('2026-09-27');
		expect(dateKey(weeks[1][0])).toBe('2026-10-04');
	});

	it('returns the correct month label', () => {
		const week = Array.from({ length: 7 }, (_, i) => new Date(2026, 8, 27 + i));

		expect(rowLabel(week)).toBe('sep/oct');
	});
});