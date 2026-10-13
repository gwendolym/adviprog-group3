export const ssr = false;

type CurrentUser = { id: number; email: string };

export async function load({ fetch }) {
	const response = await fetch('/api/me');
	const user: CurrentUser | null = response.ok ? await response.json() : null;
	return { user };
}
