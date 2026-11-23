<script lang="ts">
	import BackendError from '$lib/components/BackendError.svelte';
	import { STAGE_LABELS, STAGE_STYLES, formatPercent, slugify } from '$lib/trends';
	import type { PageData } from './$types';

	export let data: PageData;

	$: ranked = data.trends;
	$: fastest = [...ranked].sort((a, b) => b.velocityRate - a.velocityRate).slice(0, 3);
	$: categories = new Set(ranked.flatMap((t) => t.sourceCategories));
	$: asOfLabel = new Date('2026-11-23T12:00:00Z').toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
</script>

<div class="space-y-10">
	<!-- Hero -->
	<section>
		<p class="text-xs font-semibold uppercase tracking-widest text-rose-900">
			Week of {asOfLabel}
		</p>
		<h1 class="mt-2 text-4xl font-black tracking-tight sm:text-5xl">What&apos;s about to peak?</h1>
		<p class="mt-3 max-w-2xl text-base leading-relaxed text-stone-600">
			Twelve trend candidates scored from TikTok, the runway, resale demand, editorial, search,
			and more. The Trend Score blends growth, volume, cross-source breadth, sentiment, resale
			prices, and authority — then projects each trend&apos;s peak window.
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

	{#if fastest.length > 0}
		<!-- Fastest risers -->
		<section>
			<h2 class="text-lg font-bold">Fastest risers</h2>
			<div class="mt-3 grid gap-4 sm:grid-cols-3">
				{#each fastest as t (t.canonicalAttribute)}
					<a
						href="/trends/{slugify(t.canonicalAttribute)}"
						class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-rose-900"
					>
						<p class="text-2xl font-black text-rose-900">{formatPercent(t.velocityRate)}</p>
						<p class="mt-1 font-semibold capitalize">{t.canonicalAttribute}</p>
						<p class="text-xs text-stone-500">
							{STAGE_LABELS[t.stage]} · score {t.score.trendScore} · breadth {t.sourceCategories
								.length}/17
						</p>
					</a>
				{/each}
			</div>
		</section>

		<!-- Ranking -->
		<section>
			<h2 class="text-lg font-bold">Ranking</h2>
			<p class="mt-1 text-sm text-stone-500">
				Ranked by Trend Score. Click a trend for its source breakdown, weekly curve, and
				projected peak window.
			</p>
			<div class="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
				<table class="w-full min-w-[720px] text-left text-sm">
					<thead>
						<tr class="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
							<th class="px-4 py-3 font-semibold">#</th>
							<th class="px-4 py-3 font-semibold">Trend</th>
							<th class="px-4 py-3 font-semibold">Type</th>
							<th class="px-4 py-3 font-semibold">Score</th>
							<th class="px-4 py-3 font-semibold">Stage</th>
							<th class="px-4 py-3 font-semibold">Velocity</th>
							<th class="px-4 py-3 font-semibold">Breadth</th>
							<th class="px-4 py-3 font-semibold">Confidence</th>
						</tr>
					</thead>
					<tbody>
						{#each ranked as t, i (t.canonicalAttribute)}
							<tr class="border-b border-stone-100 last:border-0 hover:bg-stone-50">
								<td class="px-4 py-3 font-bold text-stone-400">{i + 1}</td>
								<td class="px-4 py-3">
									<a
										href="/trends/{slugify(t.canonicalAttribute)}"
										class="font-semibold capitalize hover:text-rose-900 hover:underline"
									>
										{t.canonicalAttribute}
									</a>
								</td>
								<td class="px-4 py-3 capitalize text-stone-500">{t.attributeType}</td>
								<td class="px-4 py-3">
									<span class="mr-2 inline-block w-8 font-bold">{t.score.trendScore}</span>
									<span class="inline-block h-2 w-20 overflow-hidden rounded-full bg-stone-200 align-middle">
										<span
											class="block h-full rounded-full bg-rose-900"
											style="width: {t.score.trendScore}%"
										></span>
									</span>
								</td>
								<td class="px-4 py-3">
									<span
										class="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 {STAGE_STYLES[
											t.stage
										]}"
									>
										{STAGE_LABELS[t.stage]}
									</span>
								</td>
								<td
									class="px-4 py-3 font-semibold {t.velocityRate >= 0
										? 'text-emerald-700'
										: 'text-rose-700'}"
								>
									{formatPercent(t.velocityRate)}
								</td>
								<td class="px-4 py-3">{t.sourceCategories.length}/17</td>
								<td class="px-4 py-3">{t.score.confidence}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}
</div>
