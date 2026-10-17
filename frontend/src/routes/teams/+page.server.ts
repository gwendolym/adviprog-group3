import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type TeamSummary = {
	id: string;
	name: string;
	createdAt: string;
	_count: {
		members: number;
	};
};

type CreatedTeam = {
	id: string;
};

// Current user teams
export const load: PageServerLoad = async ({ fetch }) => {
	const response = await fetch('/api/teams');

	if (response.status === 401) {
		redirect(303, '/login');
	}

	if (!response.ok) {
		error(response.status, 'Could not load teams');
	}

	const teams = (await response.json()) as TeamSummary[];

	return {
		teams
	};
};

// Team creation
export const actions: Actions = {
	create: async ({ request, fetch }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim() ?? '';

		if (!name) {
			return fail(400, {
				action: 'create',
				error: 'Team name is required.',
				name
			});
		}

		const response = await fetch('/api/teams', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ name })
		});

		if (response.status === 401) {
			redirect(303, '/login');
		}

		if (!response.ok) {
			return fail(response.status, {
				action: 'create',
				error: 'Could not create the team.',
				name
			});
		}

		const team = (await response.json()) as CreatedTeam;

		redirect(303, `/teams/${team.id}`);
	}
};
