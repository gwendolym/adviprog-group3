<script lang="ts">
	import { enhance } from '$app/forms';

	let { name, error, onclose }: { name: string; error?: string; onclose: () => void } = $props();

	let input = $state<HTMLInputElement>();

	$effect(function focusInput() {
		input?.focus();
		input?.select();
	});
</script>

<form
	method="POST"
	action="?/edit"
	use:enhance={() =>
		async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'success') onclose();
		}}
	class="flex flex-wrap items-center gap-2"
>
	<label for="edit-name" class="sr-only">Event name</label>
	<input
		id="edit-name"
		bind:this={input}
		name="name"
		value={name}
		autocomplete="off"
		required
		class="w-72 rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 text-xl font-semibold text-inherit outline-none focus:border-green-500 dark:border-slate-700"
	/>
	<button
		type="submit"
		class="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
	>
		Save
	</button>
	<button
		type="button"
		class="px-2 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
		onclick={onclose}
	>
		Cancel
	</button>
	{#if error}
		<p class="w-full text-sm text-red-600 dark:text-red-400">{error}</p>
	{/if}
</form>
