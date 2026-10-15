import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const response = await fetch('/api/me');
	if (!response.ok) {
		redirect(303, `/login?returnTo=${encodeURIComponent(url.pathname)}`);
	}
};
