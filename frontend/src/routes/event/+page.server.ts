import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

type CreateEventInput = {
	name: string;
	dates: string[];
	startTime: string;
	endTime: string;
	timezone: string;
};

type CreatedEvent = { id: string };

export const actions: Actions = {
	default: async ({ request, fetch }) => {
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

		let response: Response;

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
