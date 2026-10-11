<script lang="ts">
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/calendar-date-range.svg';
	import './layout.css';
	import { ThemeToggle } from '@friendofsvelte/toggle';
	import '@friendofsvelte/toggle/styles/Toggle.css';
	let { children } = $props(); // Svelte updates route props through this binding.

	function smoothScroll(event: MouseEvent) {
		event.preventDefault();
		if (window.location.pathname !== '/') {
			window.location.href = '/#features';
		} else {
			document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
		}
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
	<header class="border-b border-slate-100 dark:border-slate-800">
		<nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
			<a
				href={resolve('/')}
				class="rounded text-xl font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none dark:focus-visible:ring-slate-500"
			>
				Meetly
			</a>

			<div class="flex items-center gap-6">
				<!-- Links with a hash or to routes that don't exist yet (/login) can't go through resolve() -->
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					href="/#features"
					onclick={smoothScroll}
					class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-slate-500"
				>
					Features
				</a>

				<a
					href="/login"
					class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-slate-500"
				>
					Log in
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->

				<a
					href={resolve('/event')}
					class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:outline-none dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-slate-500 dark:focus-visible:ring-offset-slate-950"
				>
					Get started
				</a>

				<ThemeToggle />
			</div>
		</nav>
	</header>

	<main>
		{@render children()}
	</main>

	<footer class="border-t border-slate-100 dark:border-slate-800">
		<div
			class="mx-auto flex max-w-6xl items-center gap-4 px-6 py-8 text-sm text-slate-400 dark:text-slate-400"
		>
			<span class="font-semibold">Meetly</span>
			<a
				href="https://github.com/gwendolym/adviprog-group3"
				class="rounded hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none dark:hover:text-slate-200 dark:focus-visible:ring-slate-500"
			>
				Github
			</a>
			<div class="ml-auto">
				<span>DH2643 2026</span>
			</div>
		</div>
	</footer>
</div>
