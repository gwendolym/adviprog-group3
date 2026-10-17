import type { LayoutServerLoad } from './$types';

type CurrentUser = { id: number; email: string };

export const load: LayoutServerLoad = async ({ fetch }) => {
	const response = await fetch('/api/me');
	const user: CurrentUser | null = response.ok ? await response.json() : null;
	return { user };
};
