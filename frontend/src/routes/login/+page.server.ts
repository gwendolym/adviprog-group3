import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

function forwardSessionCookies(
	response: Response,
	cookies: Parameters<NonNullable<Actions['signin']>>[0]['cookies']
) {
	for (const cookie of response.headers.getSetCookie()) {
		const [nameValue, ...attributes] = cookie.split(';');
		const separator = nameValue.indexOf('=');
		if (separator < 1) continue;

		const name = nameValue.slice(0, separator).trim();
		const value = nameValue.slice(separator + 1).trim();
		const options: Parameters<typeof cookies.set>[2] = { path: '/' };

		for (const attribute of attributes) {
			const [key, rawValue] = attribute.trim().split('=');
			const normalizedKey = key.toLowerCase();
			if (normalizedKey === 'httponly') options.httpOnly = true;
			if (normalizedKey === 'secure') options.secure = true;
			if (normalizedKey === 'samesite' && rawValue) {
				options.sameSite = rawValue.toLowerCase() as 'lax' | 'strict' | 'none';
			}
			if (normalizedKey === 'max-age' && rawValue) options.maxAge = Number(rawValue);
		}

		cookies.set(name, value, options);
	}
}

async function errorMessage(response: Response): Promise<string> {
	const body = await response.json().catch(() => null);
	if (Array.isArray(body?.message)) return body.message.join(', ');
	if (typeof body?.message === 'string') return body.message;
	return 'Something went wrong. Please try again.';
}

function returnTo(form: FormData): string {
	const target = form.get('returnTo')?.toString().trim();
	if (target?.startsWith('/event') || target?.startsWith('/teams')) {
		return target;
	}
	return '/event';
}

export const actions: Actions = {
	signin: async ({ request, fetch, cookies }) => {
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

		forwardSessionCookies(response, cookies);
		redirect(303, returnTo(form));
	},

	signup: async ({ request, fetch, cookies }) => {
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

		forwardSessionCookies(response, cookies);
		redirect(303, returnTo(form));
	}
};
