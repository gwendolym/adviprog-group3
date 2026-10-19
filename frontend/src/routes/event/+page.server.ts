import { error, fail, redirect } from '@sveltejs/kit';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import type { Actions, PageServerLoad } from './$types';

type HolidayApiItem = {
	startDate: string;
	endDate: string;
	name: { language: string; text: string }[];
};

type Event = {
	id: string;
	name: string;
	dates: string[];
	startTime: string;
	endTime: string;
	timezone: string;
	creatorId: number;
};

function isEnglish(entry: { language: string; text: string }) {
	return entry.language === 'EN';
}

// TODO: Implement user nationality detection and use that to fetch holidays for the user's country instead of hardcoding Sweden.
async function loadHolidays(fetch: typeof globalThis.fetch, year: number) {
	const holidays: Record<string, string> = {};

	try {
		const params = new URLSearchParams({
			countryIsoCode: 'SE',
			languageIsoCode: 'EN',
			validFrom: `${year}-01-01`,
			validTo: `${year + 1}-12-31`
		});
		const response = await fetch(`https://openholidaysapi.org/PublicHolidays?${params}`);

		if (!response.ok) return holidays;

		const items: HolidayApiItem[] = await response.json();

		for (const item of items) {
			const name = item.name.find(isEnglish)?.text ?? 'Public holiday';

			for (const date of eachDayOfInterval({
				start: parseISO(item.startDate),
				end: parseISO(item.endDate)
			})) {
				holidays[format(date, 'yyyy-MM-dd')] = name;
			}
		}
	} catch (err) {
		console.error('Failed to load Swedish public holidays', err);
	}

	return holidays;
}

export const load: PageServerLoad = async ({ fetch, parent }) => {
	const { user } = await parent();
	if (!user) redirect(303, '/login');

	const year = new Date().getFullYear();

	const [eventsResponse, holidays] = await Promise.all([
		fetch('/api/events'),
		loadHolidays(fetch, year)
	]);

	if (!eventsResponse.ok) {
		error(500, 'Failed to load events');
	}

	const events: Event[] = await eventsResponse.json();

	return { holidays, events, currentUserId: user.id };
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
		} catch (err) {
			console.error('Failed to reach the events API', err);
			return fail(500, { error: "Couldn't create the event. Please try again." });
		}

		if (!response.ok) {
			return fail(500, { error: "Couldn't create the event. Please try again." });
		}

		const event: CreatedEvent = await response.json();
		redirect(303, `/event/${event.id}`);
	}
};
