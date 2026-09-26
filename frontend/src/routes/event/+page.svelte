<script lang="ts">
	let test = 'test';
</script>

<svelte:head>
	<title>Create Event | Meetly</title>
</svelte:head>

<section class="min-h-[calc(100vh-160px)] bg-slate-50 px-4 py-8 sm:px-6">
	<div class="mx-auto max-w-6xl">
		<h1 class="text-2xl font-semibold text-slate-900">Create an event</h1>
		<p class="mt-2 text-sm text-slate-500">Set up a meeting and invite your team.</p>

		<a href="/event/test" class="mt-4 inline-block text-sm text-blue-600 hover:underline">
			Test event
		</a>

		<p class="mt-4 text-sm text-slate-500">{test}</p>
	</div>
</section>