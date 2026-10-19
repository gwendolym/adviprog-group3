import { env } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { handleAppearance } from '@friendofsvelte/toggle';

export const handle: Handle = sequence(handleAppearance, async ({ event, resolve }) => {
	if (
		env.API_URL &&
		(event.url.pathname.startsWith('/api') || event.url.pathname.startsWith('/sockets'))
	) {
		const target = new URL(event.url.pathname + event.url.search, env.API_URL);
		const headers = new Headers(event.request.headers);
		headers.delete('host');
		if (event.url.pathname.startsWith('/sockets')) {
			headers.set('accept-encoding', 'identity');
		}

		return fetch(target, {
			method: event.request.method,
			headers,
			body: event.request.body,
			redirect: 'manual',
			// @ts-expect-error -- required by Node's fetch when streaming a request body
			duplex: 'half'
		});
	}

	return resolve(event);
});
