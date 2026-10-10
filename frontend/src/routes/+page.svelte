<script lang="ts">
	import { resolve } from '$app/paths';
	import fig1 from '$lib/assets/fig1.svg';
	import profile1 from '$lib/assets/profile1.svg';
	import profile2 from '$lib/assets/profile2.svg';
	import profile3 from '$lib/assets/profile3.svg';
	import profile4 from '$lib/assets/profile4.svg';

	const people = [
		{ name: 'Christoffer', avatar: profile1 },
		{ name: 'Albin', avatar: profile2 },
		{ name: 'Ivar', avatar: profile3 },
		{ name: 'Hannah', avatar: profile4 }
	];

	const heatmap = [0, 2, 2, 0, 0, 0, 2, 3, 2, 0, 0, 2, 3, 2, 0, 0, 2, 3, 2, 0, 0, 0, 2, 2, 0];

	function heatClass(level: number) {
		if (level >= 3) return 'bg-green-700';
		if (level === 2) return 'bg-green-400';
		if (level === 1) return 'bg-green-200';
		return 'bg-red-100';
	}
</script>

<svelte:head>
	<title>Meetly | Plan meetings together</title>
</svelte:head>

<section class="mx-auto max-w-6xl px-6 pt-20 pb-24 sm:pt-28">
	<div class="grid items-center lg:grid-cols-[1fr_350px]">
		<div class="max-w-3xl text-center lg:pl-8">
			<div
				class="mb-6 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600"
			>
				Meeting planning for teams
			</div>

			<h1 class="text-5xl font-semibold tracking-tight sm:text-6xl">
				Meetings without
				<span class="text-slate-400">the back-and-forth.</span>
			</h1>

			<p class="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
				See when your team is free, agree on a time, and keep meeting notes and documents in one
				place.
			</p>

			<div class="mt-8 flex justify-center gap-3">
				<a
					href={resolve('/event')}
					class="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
				>
					Get started
				</a>

				<a
					href="#features"
					class="rounded-lg border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
				>
					How it works
				</a>
			</div>
		</div>

		<img src={fig1} alt="" class="mx-auto h-[19.2rem] w-auto sm:h-96 lg:h-[33.6rem]" />
	</div>

	<div class="mx-auto mt-20 max-w-5xl">
		<div
			class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50"
		>
			<div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
				<div class="flex items-center gap-3">
					<div class="h-2.5 w-2.5 rounded-full bg-slate-300"></div>
					<span class="text-sm font-medium">Plan a meeting</span>
				</div>

				<span class="text-xs text-slate-400">Meetly</span>
			</div>

			<div class="grid min-h-[320px] md:grid-cols-[220px_1fr]">
				<aside class="hidden border-r border-slate-100 p-5 md:block">
					<p class="mb-4 text-xs font-medium tracking-wide text-slate-400 uppercase">Team</p>

					<div class="space-y-2">
						{#each people as person (person.name)}
							<div class="flex items-center gap-3 rounded-lg px-2 py-2">
								<div class="h-7 w-7 overflow-hidden rounded-full bg-slate-100">
									<img src={person.avatar} alt="" class="h-full w-full object-cover" />
								</div>
								<span class="text-sm text-slate-700">{person.name}</span>
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

						<span class="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
							4 people
						</span>
					</div>

					<div class="overflow-hidden rounded-xl border border-slate-100">
						<div class="grid grid-cols-5 border-b border-slate-100 bg-slate-50">
							{#each ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as day (day)}
								<div class="p-3 text-center text-xs font-medium text-slate-500">
									{day}
								</div>
							{/each}
						</div>

						<div class="grid grid-cols-5">
							{#each heatmap as level, i (i)}
								<div class={`h-12 border-r border-b border-slate-100 ${heatClass(level)}`}></div>
							{/each}
						</div>
					</div>

					<div class="mt-5 flex flex-wrap items-center justify-between gap-3">
						<div class="flex flex-wrap gap-4 text-xs text-slate-500">
							<span class="flex items-center gap-2">
								<span class="h-2.5 w-2.5 rounded-sm bg-red-100"></span>
								Unavailable
							</span>

							<span class="flex items-center gap-2">
								<span class="h-2.5 w-2.5 rounded-sm bg-green-400"></span>
								Some available
							</span>

							<span class="flex items-center gap-2">
								<span class="h-2.5 w-2.5 rounded-sm bg-green-700"></span>
								Everyone available
							</span>
						</div>

						<a
							href={resolve('/event')}
							class="rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white hover:bg-green-700"
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
			<p class="text-sm font-medium text-slate-500">What you can do</p>

			<h2 class="mt-2 text-3xl font-semibold tracking-tight">
				Everything you need to plan a meeting.
			</h2>
		</div>

		<div class="mt-12 grid gap-6 md:grid-cols-3">
			<article class="rounded-xl border border-slate-200 bg-white p-6">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-medium"
				>
					1
				</div>

				<h3 class="mt-5 font-medium">Find a time</h3>

				<p class="mt-2 text-sm leading-6 text-slate-500">
					See when everyone is available and find a time that works for the whole team.
				</p>
			</article>

			<article class="rounded-xl border border-slate-200 bg-white p-6">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-medium"
				>
					2
				</div>

				<h3 class="mt-5 font-medium">Group by topic</h3>

				<p class="mt-2 text-sm leading-6 text-slate-500">
					Keep recurring meetings, projects, and one-off discussions organized by topic.
				</p>
			</article>

			<article class="rounded-xl border border-slate-200 bg-white p-6">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-medium"
				>
					3
				</div>

				<h3 class="mt-5 font-medium">Notes & documents</h3>

				<p class="mt-2 text-sm leading-6 text-slate-500">
					Keep notes and documents with the meeting, so everything is easy to find later.
				</p>
			</article>
		</div>
	</div>
</section>
