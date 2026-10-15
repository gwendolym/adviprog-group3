<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let mode = $state<'signin' | 'signup'>('signin');
	let submitting = $state(false);

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
			<button
				type="button"
				class={`flex-1 rounded-md py-2 transition ${
					mode === 'signin'
						? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
						: 'text-slate-500 dark:text-slate-400'
				}`}
				onclick={() => (mode = 'signin')}
			>
				Log in
			</button>
			<button
				type="button"
				class={`flex-1 rounded-md py-2 transition ${
					mode === 'signup'
						? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
						: 'text-slate-500 dark:text-slate-400'
				}`}
				onclick={() => (mode = 'signup')}
			>
				Sign up
			</button>
		</div>

		<h1 class="text-center text-xl font-semibold text-slate-900 dark:text-slate-100">
			{mode === 'signin' ? 'Welcome back' : 'Create your account'}
		</h1>

		{#if form?.error}
			<p class="mt-4 text-center text-sm text-red-600 dark:text-red-400">{form.error}</p>
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
