import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { holidayCountries } from '$lib/holiday-countries';
import { loadHolidays, preferredHolidayCountry } from '$lib/holidays';

type EventTeam = { id: string; name: string };

type Event = {
	id: string;
	name: string;
	dates: string[];
	startTime: string;
	endTime: string;
	timezone: string;
	creatorId: number;
	team: EventTeam | null;
};

const countryCodes = new Set(holidayCountries.map(({ value }) => value));

export const load: PageServerLoad = async ({ fetch, parent, url }) => {
	const { user } = await parent();
	if (!user) redirect(303, '/login');
	const holidayCountry = preferredHolidayCountry(user.holidayCountry);

	const year = new Date().getFullYear();

	const [eventsResponse, teamsResponse, holidays] = await Promise.all([
		fetch('/api/events'),
		fetch('/api/teams'),
		loadHolidays(fetch, year, holidayCountry)
	]);

	if (!eventsResponse.ok) {
		error(500, 'Failed to load events');
	}

	const events: Event[] = await eventsResponse.json();
	// Teams are optional, okay to skip
	const teams: EventTeam[] = teamsResponse.ok ? await teamsResponse.json() : [];
	// Preselect from ?team=<id>, only if the user is in that team
	const requestedTeam = url.searchParams.get('team');
	const selectedTeamId = teams.some((team) => team.id === requestedTeam) ? requestedTeam : '';
	return { holidays, events, teams, selectedTeamId, holidayCountry, currentUserId: user.id };
};

type CreateEventInput = {
	name: string;
	dates: string[];
	startTime: string;
	endTime: string;
	timezone: string;
	teamId?: string;
	linkAccess?: boolean;
};

type CreatedEvent = { id: string };

export const actions: Actions = {
	setHolidayCountry: async ({ request, fetch }) => {
		const form = await request.formData();
		const holidayCountry = String(form.get('holidayCountry') ?? '');
		if (!countryCodes.has(holidayCountry))
			return fail(400, { error: 'Choose a supported country.' });
		let response: Response;
		try {
			response = await fetch('/api/me', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ holidayCountry })
			});
		} catch {
			return fail(400, { error: 'Could not save your holiday country.' });
		}
		if (!response.ok) return fail(400, { error: 'Could not save your holiday country.' });
		return { countrySaved: true };
	},
	createEvent: async function createEvent({ request, fetch }) {
		const form = await request.formData();

		const input: CreateEventInput = {
			name: form.get('name')?.toString().trim() ?? '',
			dates: form.getAll('dates').map(String).sort(),
			startTime: form.get('startTime')?.toString() ?? '',
			endTime: form.get('endTime')?.toString() ?? '',
			timezone: form.get('timezone')?.toString() ?? ''
		};
		const teamId = form.get('teamId')?.toString();
		if (teamId) {
			input.teamId = teamId;
			input.linkAccess = form.has('linkAccess');
		}

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

		if (response.status === 403) {
			return fail(403, { error: "You're not a member of that team." });
		}

		if (!response.ok) {
			return fail(500, { error: "Couldn't create the event. Please try again." });
		}

		const event: CreatedEvent = await response.json();
		redirect(303, `/event/${event.id}`);
	}
};
