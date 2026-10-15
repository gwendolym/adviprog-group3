import { fail, redirect } from '@sveltejs/kit';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import type { Actions, PageServerLoad } from './$types';

type HolidayApiItem = {
	startDate: string;
	endDate: string;
	name: { language: string; text: string }[];
};

function isEnglish(entry: { language: string; text: string }) {
	return entry.language === 'EN';
}

// TODO: Implement user nationality detection and use that to fetch holidays for the user's country instead of hardcoding Sweden.
export const load: PageServerLoad = async function load({ fetch }) {
	const userResponse = await fetch('/api/me');
	if (!userResponse.ok) redirect(303, '/login');

	const year = new Date().getFullYear();
	const holidays: Record<string, string> = {};

	try {
		const response = await fetch(
			`https://openholidaysapi.org/PublicHolidays?countryIsoCode=SE&languageIsoCode=EN&validFrom=${year}-01-01&validTo=${year + 1}-12-31`
		);

		if (response.ok) {
			const items: HolidayApiItem[] = await response.json();

			for (const item of items) {
				const name = item.name.find(isEnglish)?.text ?? 'Public holiday';
				const endDate = parseISO(item.endDate);

				for (const date of eachDayOfInterval({ start: parseISO(item.startDate), end: endDate })) {
					holidays[format(date, 'yyyy-MM-dd')] = name;
				}
			}
		}
	} catch (error) {
		console.error('Failed to load Swedish public holidays', error);
	}

	return { holidays };
};

type CreateEventInput = {
	name: string;
	dates: string[];
	startTime: string;
	endTime: string;
	timezone: string;
};

type CreatedEvent = { id: string };

export const actions: Actions = {
	default: async function createEvent({ request, fetch }) {
		const form = await request.formData();

		const input: CreateEventInput = {
			name: form.get('name')?.toString().trim() ?? '',
			dates: form.getAll('dates').map(String),
			startTime: form.get('startTime')?.toString() ?? '',
			endTime: form.get('endTime')?.toString() ?? '',
			timezone: form.get('timezone')?.toString() ?? ''
		};

		if (
			!input.name ||
			!input.timezone ||
			input.dates.length === 0 ||
			input.startTime >= input.endTime
		) {
			return fail(400, {
				error:
					'Add an event name, pick some dates, and make sure the start time is before the end time.'
			});
		}

		let response: Response; // Assignment is needed to report fetch failures outside the try block.

		try {
			response = await fetch('/api/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(input)
			});
		} catch (error) {
			console.error('Failed to reach the events API', error);
			return fail(500, { error: "Couldn't create the event. Please try again." });
		}

		if (!response.ok) {
			return fail(500, { error: "Couldn't create the event. Please try again." });
		}

		const event: CreatedEvent = await response.json();
		redirect(303, `/event/${event.id}`);
	}
};
