import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

async function errorMessage(response: Response): Promise<string> {
	const body = await response.json().catch(() => null);
	if (Array.isArray(body?.message)) return body.message.join(', ');
	if (typeof body?.message === 'string') return body.message;
	return 'Something went wrong. Please try again.';
}

export const actions: Actions = {
	signin: async ({ request, fetch }) => {
		const form = await request.formData();
		const email = form.get('email')?.toString().trim() ?? '';
		const password = form.get('password')?.toString() ?? '';

		if (!email || !password) {
			return fail(400, { mode: 'signin' as const, error: 'Enter your email and password.' });
		}

		let response: Response;
		try {
			response = await fetch('/api/auth/sign-in', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
		} catch (error) {
			console.error('Failed to reach the auth API', error);
			return fail(500, { mode: 'signin' as const, error: "Couldn't sign in. Please try again." });
		}

		if (!response.ok) {
			return fail(response.status, {
				mode: 'signin' as const,
				error: await errorMessage(response)
			});
		}

		redirect(303, '/event');
	},

	signup: async ({ request, fetch }) => {
		const form = await request.formData();
		const email = form.get('email')?.toString().trim() ?? '';
		const password = form.get('password')?.toString() ?? '';

		if (!email || !password) {
			return fail(400, { mode: 'signup' as const, error: 'Enter your email and password.' });
		}

		if (password.length < 8) {
			return fail(400, {
				mode: 'signup' as const,
				error: 'Password must be at least 8 characters.'
			});
		}

		let response: Response;
		try {
			response = await fetch('/api/auth/sign-up', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
		} catch (error) {
			console.error('Failed to reach the auth API', error);
			return fail(500, { mode: 'signup' as const, error: "Couldn't sign up. Please try again." });
		}

		if (!response.ok) {
			return fail(response.status, {
				mode: 'signup' as const,
				error: await errorMessage(response)
			});
		}

		redirect(303, '/event');
	}
};
