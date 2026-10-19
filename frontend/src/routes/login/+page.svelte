<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const modes = [
		{ value: 'signin', label: 'Log in' },
		{ value: 'signup', label: 'Sign up' }
	] as const;

	let mode = $state<'signin' | 'signup'>('signin');
	let submitting = $state(false);

	const returnTo = $derived(page.url.searchParams.get('returnTo') ?? '');

	$effect(() => {
		if (form?.mode) mode = form.mode;
	});
</script>

<svelte:head>
	<title>Log in | Meetly</title>
</svelte:head>

<section
	class="flex min-h-[calc(100vh-160px)] items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950"
>
	<div
		class="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900"
	>
		<div class="mb-6 flex rounded-lg bg-slate-100 p-1 text-sm font-medium dark:bg-slate-800">
			{#each modes as { value, label } (value)}
				<button
					type="button"
					aria-pressed={mode === value}
					class={`flex-1 rounded-md py-2 transition focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none ${
						mode === value
							? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
							: 'text-slate-500 hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-100'
					}`}
					onclick={() => (mode = value)}
				>
					{label}
				</button>
			{/each}
		</div>

		<h1 class="text-center text-xl font-semibold text-slate-900 dark:text-slate-100">
			{mode === 'signin' ? 'Welcome back' : 'Create your account'}
		</h1>

		{#if form?.error ?? data.oauthError}
			<p class="mt-4 text-center text-sm text-red-600 dark:text-red-400">
				{form?.error ?? data.oauthError}
			</p>
		{/if}

		{#if data.googleEnabled}
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href={data.googleUrl}
				data-sveltekit-reload
				class="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
					<path
						fill="#4285F4"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
					/>
					<path
						fill="#34A853"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
					/>
					<path
						fill="#FBBC05"
						d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"
					/>
					<path
						fill="#EA4335"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
					/>
				</svg>
				Continue with Google
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->

			<div class="mt-6 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
				<span class="h-px flex-1 bg-slate-200 dark:bg-slate-700"></span>
				or
				<span class="h-px flex-1 bg-slate-200 dark:bg-slate-700"></span>
			</div>
		{/if}

		<form
			method="POST"
			action={mode === 'signin' ? '?/signin' : '?/signup'}
			class="mt-6 space-y-4"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<input type="hidden" name="returnTo" value={returnTo} />
			<div>
				<label
					class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
					for="email"
				>
					Email
				</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-green-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-green-500"
				/>
			</div>

			<div>
				<label
					class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
					for="password"
				>
					Password
				</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete={mode === 'signin' ? 'current-password' : 'new-password'}
					minlength={mode === 'signup' ? 8 : undefined}
					required
					class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-green-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-green-500"
				/>
			</div>

			<button
				type="submit"
				disabled={submitting}
				class="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-green-600 dark:hover:bg-green-500"
			>
				{mode === 'signin' ? 'Log in' : 'Sign up'}
			</button>
		</form>
	</div>
</section>
