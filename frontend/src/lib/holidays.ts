import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { holidayCountries } from './holiday-countries';

const countryCodes = new Set(holidayCountries.map(({ value }) => value));
export const preferredHolidayCountry = (country: string | null | undefined) =>
	country === 'NONE' ? 'NONE' : country && countryCodes.has(country) ? country : 'SE';

type HolidayApiItem = {
	startDate: string;
	endDate: string;
	name: { language: string; text: string }[];
};

export async function loadHolidays(fetch: typeof globalThis.fetch, year: number, country: string) {
	const holidays: Record<string, string> = {};
	if (country === 'NONE') return holidays;
	try {
		const params = new URLSearchParams({
			countryIsoCode: country,
			languageIsoCode: 'EN',
			validFrom: `${year}-01-01`,
			validTo: `${year + 1}-12-31`
		});
		const response = await fetch(`https://openholidaysapi.org/PublicHolidays?${params}`);
		if (!response.ok) return holidays;
		const items: HolidayApiItem[] = await response.json();
		for (const item of items) {
			const name = item.name.find((entry) => entry.language === 'EN')?.text ?? 'Public holiday';
			for (const date of eachDayOfInterval({
				start: parseISO(item.startDate),
				end: parseISO(item.endDate)
			}))
				holidays[format(date, 'yyyy-MM-dd')] = name;
		}
	} catch (err) {
		console.error(`Failed to load ${country} public holidays`, err);
	}
	return holidays;
}
