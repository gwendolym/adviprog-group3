<script lang="ts">
	import favicon from '$lib/assets/calendar-date-range.svg';
	import './layout.css';
	let { children } = $props();
	const currentYear = new Date().getFullYear();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-white text-slate-900">
	<header class="border-b border-slate-100">
		<nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
			<a href="/" class="text-xl font-semibold tracking-tight">Meetly</a>

			<div class="flex items-center gap-6">
				<a href="/#features" class="hidden text-sm text-slate-600 hover:text-slate-900 sm:block">
					Features
				</a>

				<a
					href="/login"
					class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
				>
					Log in
				</a>

				<a
					href="/event"
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
				<span>DH2642 {currentYear}</span>
			</div>
		</div>
	</footer>
</div>
