<script lang="ts">
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/calendar-date-range.svg';
	import './layout.css';
	let { children } = $props(); // Svelte updates route props through this binding.
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-white text-slate-900">
	<header class="border-b border-slate-100">
		<nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
			<a href={resolve('/')} class="text-xl font-semibold tracking-tight">Meetly</a>

			<div class="flex items-center gap-6">
				<!-- Links with a hash or to routes that don't exist yet (/login) can't go through resolve() -->
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a href="/#features" class="hidden text-sm text-slate-600 hover:text-slate-900 sm:block">
					Features
				</a>

				<a
					href="/login"
					class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
				>
					Log in
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->

				<a
					href={resolve('/event')}
					class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
				>
					Get started
				</a>
			</div>
		</nav>
	</header>

	<main>
		{@render children()}
	</main>

	<footer class="border-t border-slate-100">
		<div class="mx-auto flex max-w-6xl items-center gap-4 px-6 py-8 text-sm text-slate-400">
			<span class="font-semibold">Meetly</span>
			<a href="https://github.com/gwendolym/adviprog-group3">Github</a>
			<div class="ml-auto">
				<span>DH2643 2026</span>
			</div>
		</div>
	</footer>
</div>
