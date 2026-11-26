<script lang="ts">
	import BackendError from '$lib/components/BackendError.svelte';
	import TrendCover from '$lib/components/TrendCover.svelte';
	import { SCORE_BANDS, SIGNAL_DESCRIPTIONS, SIGNAL_LABELS } from '$lib/trends';
	import type { PageData } from './$types';

	export let data: PageData;

	$: ranked = data.trends;
	$: featured = ranked[0];
	$: rest = ranked.slice(1);
	$: categories = new Set(ranked.flatMap((t) => t.sourceCategories));
	$: asOfLabel = new Date('2026-11-23T12:00:00Z').toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
</script>

<div class="space-y-12">
	<!-- Hero: one line, then the trends -->
	<section>
		<p class="text-xs font-semibold uppercase tracking-widest text-rose-900">
			Week of {asOfLabel}
		</p>
		<h1 class="mt-2 text-4xl font-black tracking-tight sm:text-5xl">What&apos;s about to peak?</h1>
		<p class="mt-3 max-w-2xl text-base leading-relaxed text-stone-600">
			The trends gaining ground right now, scored from the runway, the feed, resale, and the
			street. Tap any cover for the full story.
		</p>
		<div class="mt-5 flex flex-wrap gap-6 text-sm">
			<span>
				<span class="font-bold">{ranked.length}</span>
				<span class="text-stone-500"> trends tracked</span>
			</span>
			<span>
				<span class="font-bold">{data.observationCount}</span>
				<span class="text-stone-500"> observations</span>
			</span>
			<span>
				<span class="font-bold">{categories.size}</span>
				<span class="text-stone-500"> source categories live</span>
			</span>
			<span>
				<span class="font-bold">{data.weeksOfData}</span>
				<span class="text-stone-500"> weeks of data</span>
			</span>
		</div>
	</section>

	{#if data.error}
		<BackendError message={data.error} apiBase={data.apiBase} />
	{/if}

	{#if ranked.length === 0 && !data.error}
		<p class="text-sm text-stone-500">No trends returned yet.</p>
	{/if}

	{#if ranked.length > 0}
		<!-- The rack: up and coming trends first -->
		<section>
			<h2 class="text-lg font-bold">Up and coming</h2>
			<p class="mt-1 text-sm text-stone-500">
				Ranked by Trend Score. The cover, the score, and how long it has held the top ranks.
			</p>
			<div class="mt-4">
				<TrendCover trend={featured} rank={1} featured />
			</div>
			<div class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each rest as t, i (t.canonicalAttribute)}
					<TrendCover trend={t} rank={i + 2} />
				{/each}
			</div>
		</section>

		<!-- Score decoder: below the trends, half width, soft panel -->
		<section class="mx-auto max-w-xl rounded-2xl border border-stone-200 bg-amber-50 p-6 shadow-sm">
			<h2 class="text-lg font-bold">What the score means</h2>
			<p class="mt-1 text-sm leading-relaxed text-stone-600">
				Every trend scores 0 to 100. Here is what the number reads like, in plain words.
			</p>
			<ul class="mt-4 space-y-3">
				{#each SCORE_BANDS as band (band.label)}
					<li class="flex items-baseline gap-3 text-sm">
						<span
							class="w-28 shrink-0 rounded-full px-2.5 py-0.5 text-center text-xs font-semibold ring-1 {band.style}"
						>
							{band.label}
						</span>
						<span class="text-stone-600">
							<span class="font-semibold text-stone-900">{band.min} to {band.max}</span>
							{' · '}{band.description}
						</span>
					</li>
				{/each}
			</ul>
			<h3 class="mt-6 text-sm font-bold uppercase tracking-wide text-stone-700">
				What goes into it
			</h3>
			<ul class="mt-3 space-y-2">
				{#each Object.entries(SIGNAL_LABELS) as [key, label] (key)}
					<li class="text-sm text-stone-600">
						<span class="font-semibold text-stone-900">{label}</span>
						{' · '}{SIGNAL_DESCRIPTIONS[key]}
					</li>
				{/each}
			</ul>
			<p class="mt-4 text-sm text-stone-600">
				<a href="/methodology" class="font-medium text-rose-900 hover:underline">
					How the score comes together
				</a>
				, with every source we watch.
			</p>
		</section>
	{/if}
</div>
