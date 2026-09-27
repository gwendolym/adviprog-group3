import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const form = await request.formData();

		const name = form.get('name')?.toString().trim() ?? '';
		const dates = form.getAll('dates').map(String);
		const startTime = form.get('startTime')?.toString() ?? '';
		const endTime = form.get('endTime')?.toString() ?? '';
		const timezone = form.get('timezone')?.toString() ?? '';

		if (!name || dates.length === 0 || startTime >= endTime) {
			return fail(400, {
				error: 'Add an event name, pick some dates, and make sure the start time is before the end time.'
			});
		}

		const response = await fetch('/api/events', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, dates, startTime, endTime, timezone })
		});

		if (!response.ok) {
			return fail(500, { error: "Couldn't create the event. Please try again." });
		}

		const event: { id: string } = await response.json();
		redirect(303, `/event/${event.id}`);
	}
};