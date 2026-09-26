<!-- <h1>{data.message}</h1> -->

<script lang="ts">
	let { data } = $props();

	// Mock data for the landing page.
	const features = [
		{
			number: '01',
			title: 'Find a time',
			description:
				"See everyone's availability update live as teammates respond, and land on a time that works for the whole team without the back-and-forth."
		},
		{
			number: '02',
			title: 'Group by topic',
			description:
				'Organize meetings by topic so recurring discussions, projects, and one-offs stay easy to find and follow.'
		},
		{
			number: '03',
			title: 'Notes & documents',
			description:
				'Keep meeting notes and documents attached to the meeting they belong to, so nothing gets lost after the call ends.'
		}
	];

	const people = ['Christoffer', 'Albin', 'Ivar', 'Hannah'];

	const availableSlots = [1, 2, 6, 7, 8, 11, 12, 13, 16, 17, 18, 21, 22];
</script>

<svelte:head>
	<title>Meetly — Meetings without the back-and-forth</title>

	<meta
		name="description"
		content="Plan meetings, find common team availability in real time, and keep notes and documents organized by topic."
	/>
</svelte:head>

<section class="mx-auto max-w-6xl px-6 pt-20 pb-24 sm:pt-28">
	<div class="mx-auto max-w-3xl text-center">
		<div
			class="mb-6 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600"
		>
			Real-time meeting planning for teams
		</div>

		<h1 class="text-5xl font-semibold tracking-tight sm:text-6xl">
			Meetings without
			<span class="text-slate-400">the back-and-forth.</span>
		</h1>

		<p class="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
			See when your team is free, agree on a time together as availability updates live, and
			keep every topic's notes and documents right where the meeting happened.
		</p>

		<div class="mt-8 flex justify-center gap-3">
			<a
				href="/login"
				class="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
			>
				Get started
			</a>

			<a
				href="#features"
				class="rounded-lg border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
			>
				Learn more
			</a>
		</div>
	</div>

	<div class="mx-auto mt-20 max-w-5xl">
		<div
			class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50"
		>
			<div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
				<div class="flex items-center gap-3">
					<div class="h-2.5 w-2.5 rounded-full bg-slate-300"></div>

					<span class="text-sm font-medium"> Plan a meeting </span>
				</div>

				<span class="text-xs text-slate-400"> Meetly </span>
			</div>

			<div class="grid min-h-[320px] md:grid-cols-[220px_1fr]">
				<!-- Team -->
				<aside class="hidden border-r border-slate-100 p-5 md:block">
					<p class="mb-4 text-xs font-medium tracking-wide text-slate-400 uppercase">Team</p>

					<div class="space-y-2">
						{#each people as person}
							<div class="flex items-center gap-3 rounded-lg px-2 py-2">
								<div class="h-7 w-7 rounded-full bg-slate-100"></div>

								<span class="text-sm text-slate-700">
									{person}
								</span>
							</div>
						{/each}
					</div>
				</aside>

				<div class="p-5 sm:p-8">
					<div class="mb-6 flex items-center justify-between">
						<div>
							<h2 class="font-medium">Team availability</h2>

							<p class="mt-1 text-sm text-slate-400">September 28 – October 2</p>
						</div>

						<span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
							4 people
						</span>
					</div>

					<div class="overflow-hidden rounded-xl border border-slate-100">
						<div class="grid grid-cols-5 border-b border-slate-100 bg-slate-50">
							{#each ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as day}
								<div class="p-3 text-center text-xs font-medium text-slate-500">
									{day}
								</div>
							{/each}
						</div>

						<div class="grid grid-cols-5">
							{#each Array(25) as _, i}
								<div
									class:h-12={true}
									class:border-b={true}
									class:border-r={true}
									class:border-slate-100={true}
									class:bg-slate-100={availableSlots.includes(i)}
								></div>
							{/each}
						</div>
					</div>

					<div class="mt-5 flex items-center justify-between">
						<div class="flex items-center gap-2 text-xs text-slate-500">
							<span class="h-2.5 w-2.5 rounded-full bg-slate-200"></span>

							Available
						</div>

						<a
							href="/login"
							class="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white"
						>
							Create meeting
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<section id="features" class="border-t border-slate-100 bg-slate-50">
	<div class="mx-auto max-w-6xl px-6 py-20">
		<div class="max-w-xl">
			<p class="text-sm font-medium text-slate-500">Everything in one place</p>

			<h2 class="mt-2 text-3xl font-semibold tracking-tight">
				Less coordination. More getting things done.
			</h2>
		</div>

		<div class="mt-12 grid gap-6 md:grid-cols-3">
			{#each features as feature}
				<article class="rounded-xl border border-slate-200 bg-white p-6">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-medium"
					>
						{feature.number}
					</div>

					<h3 class="mt-5 font-medium">
						{feature.title}
					</h3>

					<p class="mt-2 text-sm leading-6 text-slate-500">
						{feature.description}
					</p>
				</article>
			{/each}
		</div>
	</div>
</section>