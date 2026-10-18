<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let copied = $state(false);
	let submitting = $state(false);

	const isMember = $derived(
		data.user !== null && data.team.members.some((member) => member.user.id === data.user?.id)
	);

	async function copyInviteLink() {
		try {
			await navigator.clipboard.writeText(window.location.href);
			copied = true;

			setTimeout(() => {
				copied = false;
			}, 1500);
		} catch {
			copied = false;
		}
	}
</script>

<svelte:head>
	<title>{data.team.name} | Meetly</title>
</svelte:head>

<section class="mx-auto max-w-4xl px-6 py-12">
	<header>
		<div class="min-w-0">
			<a
				href={resolve('/teams')}
				class="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
			>
				← Your teams
			</a>

			<h1 class="mt-3 text-3xl font-semibold break-words">{data.team.name}</h1>

			<p class="mt-2 text-slate-500">
				{data.team.members.length}
				{data.team.members.length === 1 ? ' member' : ' members'}
			</p>
		</div>

		<div class="mt-5 flex flex-wrap gap-3">
			{#if isMember}
				<button
					type="button"
					onclick={copyInviteLink}
					class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
				>
					{copied ? 'Copied!' : 'Copy invite link'}
				</button>

				<form
					method="POST"
					action="?/leave"
					use:enhance={() => {
						submitting = true;

						return async ({ update }) => {
							await update();
							submitting = false;
						};
					}}
				>
					<button
						type="submit"
						disabled={submitting}
						class="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
					>
						{submitting ? 'Leaving…' : 'Leave team'}
					</button>
				</form>
			{:else}
				<form
					method="POST"
					action="?/join"
					use:enhance={() => {
						submitting = true;

						return async ({ update }) => {
							await update();
							submitting = false;
						};
					}}
				>
					<button
						type="submit"
						disabled={submitting}
						class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
					>
						{submitting ? 'Joining…' : 'Join team'}
					</button>
				</form>
			{/if}
		</div>
	</header>

	{#if form?.error}
		<p class="mt-4 text-sm text-red-600 dark:text-red-400">
			{form.error}
		</p>
	{/if}

	<section class="mt-10">
		<h2 class="text-xl font-semibold">Members</h2>

		{#if data.team.members.length === 0}
			<p class="mt-4 text-slate-500">This team currently has no members.</p>
		{:else}
			<ul
				class="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900"
			>
				{#each data.team.members as member (member.user.id)}
					<li class="flex items-center justify-between gap-4 p-4">
						<div>
							<p class="font-medium">
								{member.user.name ?? member.user.email}
							</p>

							{#if member.user.name}
								<p class="text-sm text-slate-500">
									{member.user.email}
								</p>
							{/if}
						</div>

						{#if member.user.id === data.user?.id}
							<span
								class="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300"
							>
								You
							</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</section>
