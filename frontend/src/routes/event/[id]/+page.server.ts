import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { user } = await parent();
	if (!user) {
		redirect(303, `/login?returnTo=${encodeURIComponent(url.pathname)}`);
	}
};

export const actions: Actions = {
	edit: async ({ params, request, fetch }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim() ?? '';

		if (!name) {
			return fail(400, { error: 'Add an event name.' });
		}

		let response: Response;

		try {
			response = await fetch(`/api/events/${params.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name })
			});
		} catch (err) {
			console.error('Failed to reach the events API', err);
			return fail(500, { error: "Couldn't save the changes. Please try again." });
		}

		if (response.status === 403) {
			return fail(403, { error: 'Only the event creator can edit this event.' });
		}

		if (!response.ok) {
			return fail(500, { error: "Couldn't save the changes. Please try again." });
		}

		return { success: true };
	}
};
