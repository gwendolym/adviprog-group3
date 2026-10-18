import { describe, expect, it, vi } from 'vitest';
import { loadHolidays, preferredHolidayCountry } from './holidays';

describe('public holidays', () => {
	it('uses the selected country and falls back to Sweden for missing or unsupported preferences', () => {
		expect(preferredHolidayCountry('IE')).toBe('IE');
		expect(preferredHolidayCountry('NONE')).toBe('NONE');
		expect(preferredHolidayCountry(null)).toBe('SE');
		expect(preferredHolidayCountry('XX')).toBe('SE');
	});

	it('does not fetch holidays when None is selected', async () => {
		const fetch = vi.fn();
		await expect(loadHolidays(fetch, 2026, 'NONE')).resolves.toEqual({});
		expect(fetch).not.toHaveBeenCalled();
	});

	it('fetches the selected country holidays', async () => {
		const fetch = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify([
					{
						startDate: '2026-05-17',
						endDate: '2026-05-17',
						name: [{ language: 'EN', text: 'Constitution Day' }]
					}
				]),
				{ status: 200 }
			)
		);
		expect(await loadHolidays(fetch, 2026, 'IE')).toEqual({ '2026-05-17': 'Constitution Day' });
		expect(fetch.mock.calls[0][0]).toContain('countryIsoCode=IE');
	});

	it('returns no holidays when the API fails or does not support the country', async () => {
		const unavailable = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
		const networkError = vi.fn().mockRejectedValue(new Error('offline'));
		await expect(loadHolidays(unavailable, 2026, 'IE')).resolves.toEqual({});
		await expect(loadHolidays(networkError, 2026, 'IE')).resolves.toEqual({});
	});
});
