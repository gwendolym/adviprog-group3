<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Teams | Meetly</title>
</svelte:head>

<section class="mx-auto max-w-4xl px-6 py-12">
	<header>
		<p class="text-sm font-medium text-slate-500">Meetly</p>
		<h1 class="mt-1 text-3xl font-semibold">Your teams</h1>
		<p class="mt-2 text-slate-500">Create a team or open one of your existing teams.</p>
	</header>

	<section
		class="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
	>
		<h2 class="font-medium">Create a team</h2>

		<form method="POST" action="?/create" use:enhance class="mt-4 flex flex-col gap-3 sm:flex-row">
			<label class="flex-1">
				<span class="sr-only">Team name</span>
				<input
					name="name"
					value={form?.name ?? ''}
					placeholder="Team name"
					autocomplete="off"
					class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
				/>
			</label>

			<button
				type="submit"
				class="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
			>
				Create team
			</button>
		</form>

		{#if form?.action === 'create' && form?.error}
			<p class="mt-3 text-sm text-red-600">{form.error}</p>
		{/if}
	</section>

	<section class="mt-10">
		<h2 class="text-xl font-semibold">Your teams</h2>

		{#if data.teams.length === 0}
			<p class="mt-4 text-slate-500">You are not a member of any teams yet.</p>
		{:else}
			<ul class="mt-4 grid gap-4 sm:grid-cols-2">
				{#each data.teams as team (team.id)}
					<li>
						<a
							href={resolve('/teams/[id]', { id: team.id })}
							class="block rounded-xl border border-slate-200 bg-white p-5 hover:border-green-500 dark:border-slate-800 dark:bg-slate-900"
						>
							<h3 class="font-medium">{team.name}</h3>
							<p class="mt-2 text-sm text-slate-500">
								{team._count.members}
								{team._count.members === 1 ? ' member' : ' members'}
							</p>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</section>
