import { isRedirect } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const env = vi.hoisted(() => ({}) as Record<string, string | undefined>);
vi.mock('$env/dynamic/private', () => ({ env }));

const { actions, load } = await import('../../routes/login/+page.server');

type Fields = Record<string, string>;

function formRequest(fields: Fields) {
	const body = new FormData();
	for (const [key, value] of Object.entries(fields)) body.set(key, value);
	return new Request('http://localhost/login', { method: 'POST', body });
}

function cookieJar() {
	return { set: vi.fn() };
}

async function run(action: 'signin' | 'signup', fields: Fields, fetch: typeof globalThis.fetch) {
	const cookies = cookieJar();
	try {
		const result = await actions[action]!({
			request: formRequest(fields),
			fetch,
			cookies
		} as never);
		return { result, cookies, redirectTo: null };
	} catch (thrown) {
		if (isRedirect(thrown)) return { result: null, cookies, redirectTo: thrown.location };
		throw thrown;
	}
}

const ok = () =>
	vi.fn().mockResolvedValue(
		new Response('{}', {
			status: 200,
			headers: { 'Set-Cookie': 'session=abc; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=60' }
		})
	);

describe('login page', () => {
	beforeEach(() => {
		for (const key of Object.keys(env)) delete env[key];
	});

	describe('load', () => {
		it('hides Google login when it is not configured', () => {
			const data = load({ url: new URL('http://localhost/login') } as never);

			expect(data).toMatchObject({ googleEnabled: false, oauthError: null });
		});

		it('shows Google login and keeps a safe returnTo', () => {
			env.GOOGLE_CLIENT_ID = 'id';
			env.GOOGLE_CLIENT_SECRET = 'secret';

			const data = load({ url: new URL('http://localhost/login?returnTo=/teams/7') } as never);

			expect(data).toMatchObject({
				googleEnabled: true,
				googleUrl: '/api/auth/oidc/google/login?redirectTo=%2Fteams%2F7'
			});
		});

		it('explains a failed Google login', () => {
			const data = load({ url: new URL('http://localhost/login?error=denied') } as never);

			expect(data).toMatchObject({
				oauthError: expect.stringContaining("Couldn't sign in with Google")
			});
		});
	});

	describe('signin', () => {
		it('forwards the session cookie and redirects to /event', async () => {
			const fetch = ok();

			const { redirectTo, cookies } = await run(
				'signin',
				{ email: 'hannah@example.com ', password: 'thisismyrealpassword1' },
				fetch
			);

			expect(redirectTo).toBe('/event');
			expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
				email: 'hannah@example.com',
				password: 'thisismyrealpassword1'
			});
			expect(cookies.set).toHaveBeenCalledWith('session', 'abc', {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'lax',
				maxAge: 60
			});
		});

		it.each(['/event/abc', '/teams/7'])('returns to the app page %s', async (target) => {
			const { redirectTo } = await run(
				'signin',
				{ email: 'hannah@example.com', password: 'thisismyrealpassword1', returnTo: target },
				ok()
			);

			expect(redirectTo).toBe(target);
		});

		it.each(['https://evil.example', '//evil.example', '/admin', 'javascript:alert(1)'])(
			'ignores an unsafe returnTo %s',
			async (target) => {
				const { redirectTo } = await run(
					'signin',
					{ email: 'hannah@example.com', password: 'thisismyrealpassword1', returnTo: target },
					ok()
				);

				expect(redirectTo).toBe('/event');
			}
		);

		it('asks for both fields before calling the API', async () => {
			const fetch = vi.fn();

			const { result } = await run('signin', { email: 'hannah@example.com', password: '' }, fetch);

			expect(result).toMatchObject({
				status: 400,
				data: { error: 'Enter your email and password.' }
			});
			expect(fetch).not.toHaveBeenCalled();
		});

		it('shows the API error message', async () => {
			const fetch = vi
				.fn()
				.mockResolvedValue(
					new Response(JSON.stringify({ message: 'Invalid email or password' }), { status: 401 })
				);

			const { result, cookies } = await run(
				'signin',
				{ email: 'hannah@example.com', password: 'thisisthewrongpassword2' },
				fetch
			);

			expect(result).toMatchObject({ status: 401, data: { error: 'Invalid email or password' } });
			expect(cookies.set).not.toHaveBeenCalled();
		});

		it('handles an unreachable API', async () => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
			const fetch = vi.fn().mockRejectedValue(new Error('down'));

			const { result } = await run(
				'signin',
				{ email: 'hannah@example.com', password: 'thisismyrealpassword1' },
				fetch
			);

			expect(result).toMatchObject({ status: 500 });
		});
	});

	describe('signup', () => {
		it('rejects a short password before calling the API', async () => {
			const fetch = vi.fn();

			const { result } = await run(
				'signup',
				{ email: 'hannah@example.com', password: 'slay' },
				fetch
			);

			expect(result).toMatchObject({
				status: 400,
				data: { mode: 'signup', error: 'Password must be at least 8 characters.' }
			});
			expect(fetch).not.toHaveBeenCalled();
		});

		it('joins a list of validation messages', async () => {
			const fetch = vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ message: ['email must be an email', 'too long'] }), {
					status: 400
				})
			);

			const { result } = await run('signup', { email: 'a@b', password: 'thisismyrealpassword1' }, fetch);

			expect(result).toMatchObject({ data: { error: 'email must be an email, too long' } });
		});

		it('signs up and redirects', async () => {
			const { redirectTo } = await run(
				'signup',
				{ email: 'hannah@example.com', password: 'thisismyrealpassword1' },
				ok()
			);

			expect(redirectTo).toBe('/event');
		});
	});
});
