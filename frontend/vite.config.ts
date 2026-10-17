import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// Ports come from the shared .env in the repo root
const env = loadEnv('', fileURLToPath(new URL('..', import.meta.url)), '');

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	},
	server: {
		port: Number(env.FRONTEND_PORT),
		strictPort: true,
		watch: {
			usePolling: true
		},
		proxy: {
			'/api': process.env.API_URL ?? `http://localhost:${env.BACKEND_PORT}`,
			'/sockets': {
				target: process.env.API_URL ?? `http://localhost:${env.BACKEND_PORT}`,
				ws: true
			}
		}
	}
});
