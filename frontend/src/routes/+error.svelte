<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
</script>

<div class="mx-auto max-w-md px-6 py-24 text-center">
	<p class="text-5xl font-semibold">{page.status}</p>
	<h1 class="mt-4 text-xl font-semibold">{page.error?.message}</h1>
	<a
		href={resolve('/event')}
		class="mt-8 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
	>
		Back to events
	</a>
</div>
