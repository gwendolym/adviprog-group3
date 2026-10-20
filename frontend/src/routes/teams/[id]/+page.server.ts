import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type TeamMember = {
	joinedAt: string;
	user: {
		id: number;
		name: string | null;
		email: string;
	};
};

type TeamEvent = {
	id: string;
	name: string;
	dates: string[];
	isPublic: boolean;
};

type TeamDetails = {
	id: string;
	name: string;
	createdAt: string;
	members: TeamMember[];
};

// Create login URL
function loginUrl(teamId: string) {
	const returnTo = `/teams/${teamId}`;
	return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}

// Get team details
export const load: PageServerLoad = async ({ params, fetch }) => {
	const [response, eventsResponse] = await Promise.all([
		fetch(`/api/teams/${params.id}`),
		fetch(`/api/teams/${params.id}/events`)
	]);

	if (response.status === 401) {
		redirect(303, loginUrl(params.id));
	}

	if (response.status === 404) {
		error(404, 'Team not found');
	}

	if (!response.ok) {
		error(response.status, 'Could not load team');
	}

	const team = (await response.json()) as TeamDetails;

	return {
		team,
		// Only members get a list, everyone else (and any failure) gets none
		events: eventsResponse.ok ? ((await eventsResponse.json()) as TeamEvent[]) : []
	};
};

// Join or leave a team
export const actions: Actions = {
	join: async ({ params, fetch }) => {
		const response = await fetch(`/api/teams/${params.id}/join`, {
			method: 'POST'
		});

		if (response.status === 401) {
			redirect(303, loginUrl(params.id));
		}

		if (response.status === 404) {
			return fail(404, {
				action: 'join',
				error: 'Team not found.'
			});
		}

		if (response.status === 409) {
			return fail(409, {
				action: 'join',
				error: 'You are already a member of this team.'
			});
		}

		if (!response.ok) {
			return fail(response.status, {
				action: 'join',
				error: 'Could not join the team.'
			});
		}

		return { success: true };
	},

	leave: async ({ params, fetch }) => {
		const response = await fetch(`/api/teams/${params.id}/leave`, {
			method: 'DELETE'
		});

		if (response.status === 401) {
			redirect(303, loginUrl(params.id));
		}

		if (response.status === 404) {
			return fail(404, {
				action: 'leave',
				error: 'You are not a member of this team.'
			});
		}

		if (!response.ok) {
			return fail(response.status, {
				action: 'leave',
				error: 'Could not leave the team.'
			});
		}

		redirect(303, '/teams');
	}
};
