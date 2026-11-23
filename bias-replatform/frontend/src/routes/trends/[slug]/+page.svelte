<script lang="ts">
	import BackendError from '$lib/components/BackendError.svelte';
	import {
		CATEGORY_LABELS,
		STAGE_LABELS,
		STAGE_STYLES,
		formatPercent
	} from '$lib/trends';
	import type { PageData } from './$types';

	export let data: PageData;

	$: detail = data.detail;
	$: trend = detail?.trend;
	$: maxWeekVolume = detail ? Math.max(1, ...detail.weekly.map((w) => w.volume)) : 1;
	$: peakLabel = !trend
		? ''
		: trend.forecast.weeksToPeak === 0
			? 'Already peaked'
			: `Peak in ~${trend.forecast.peakWindowStartWeeks}–${trend.forecast.peakWindowEndWeeks} weeks`;
	$: asOfLabel = new Date('2026-11-23T12:00:00Z').toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
</script>

<div class="space-y-10">
	<a href="/" class="text-sm font-medium text-stone-500 hover:text-rose-900">← Back to dashboard</a>

	{#if data.error}
		<BackendError message={data.error} apiBase={data.apiBase} />
	{/if}

	{#if trend && detail}
		<!-- Header -->
		<section class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<p class="text-xs font-semibold uppercase tracking-widest text-stone-500">
					{trend.attributeType}
				</p>
				<h1 class="mt-1 text-4xl font-black capitalize tracking-tight">
					{trend.canonicalAttribute}
				</h1>
				<p class="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
					{#if detail.rawTerms.length}
						Seen as {detail.rawTerms.map((t) => `“${t}”`).join(', ')} across
					{:else}
						Seen across
					{/if}
					{trend.sourceCategories.length} source categories, from {trend.observationCount} observations
					over 8 weeks.
				</p>
			</div>
			<div class="flex items-center gap-3">
				<span class="rounded-full px-3 py-1 text-sm font-semibold ring-1 {STAGE_STYLES[trend.stage]}">
					{STAGE_LABELS[trend.stage]}
				</span>
				<div class="rounded-xl border border-stone-200 bg-white px-4 py-2 text-center shadow-sm">
					<p class="text-2xl font-black leading-none">{trend.score.trendScore}</p>
					<p class="mt-1 text-[11px] uppercase tracking-wide text-stone-500">Trend Score</p>
				</div>
			</div>
		</section>

		<!-- Forecast -->
		<section class="rounded-xl border border-rose-900/20 bg-rose-50 p-5">
			<h2 class="text-sm font-bold uppercase tracking-wide text-rose-900">Forecast</h2>
			<p class="mt-2 text-lg font-semibold">{peakLabel}</p>
			<p class="mt-1 text-sm text-stone-600">
				Projected peak score {trend.forecast.estimatedPeakScore} · velocity
				{formatPercent(trend.velocityRate)} week over week
				{#if trend.accelerationRate !== 0}
					({trend.accelerationRate > 0 ? 'accelerating' : 'decelerating'} by {Math.abs(
						Math.round(trend.accelerationRate * 100)
					)} pts)
				{/if}
				· confidence {trend.score.confidence}/100.
			</p>
		</section>

		<!-- Score breakdown -->
		<section>
			<h2 class="text-lg font-bold">Score breakdown</h2>
			<p class="mt-1 text-sm text-stone-500">
				Trend Score = 0.30·velocity + 0.20·volume + 0.20·breadth + 0.10·sentiment +
				0.10·resale + 0.10·authority. Each component is normalized to 0–100 first.
			</p>
			<div class="mt-4 grid gap-5 rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-2">
				{#each [
					{ label: 'Velocity', value: trend.score.velocity, hint: `Week-over-week growth ${formatPercent(trend.velocityRate)}.` },
					{ label: 'Volume', value: trend.score.volume, hint: `Decayed total volume ${trend.totalVolume.toLocaleString()}, log-normalized vs the dataset max.` },
					{ label: 'Breadth', value: trend.score.breadth, hint: `${trend.sourceCategories.length} of 17 source categories are observing this trend.` },
					{ label: 'Sentiment', value: trend.score.sentiment, hint: 'Volume-weighted average sentiment over the last 4 weeks.' },
					{ label: 'Resale', value: trend.score.resale, hint: 'Resale price premium vs retail plus sell-through. 50 when no resale data exists.' },
					{ label: 'Authority', value: trend.score.authority, hint: 'Share of recent volume from runway, editorial, and color-authority sources.' }
				] as bar (bar.label)}
					<div>
						<div class="flex items-baseline justify-between text-sm">
							<span class="font-medium">{bar.label}</span>
							<span class="font-bold">{bar.value}</span>
						</div>
						<div class="mt-1 h-2 overflow-hidden rounded-full bg-stone-200">
							<span class="block h-full rounded-full bg-rose-900" style="width: {bar.value}%"></span>
						</div>
						<p class="mt-1 text-xs text-stone-500">{bar.hint}</p>
					</div>
				{/each}
			</div>
		</section>

		<!-- Weekly curve -->
		<section>
			<h2 class="text-lg font-bold">Weekly volume</h2>
			<p class="mt-1 text-sm text-stone-500">
				Raw weekly mentions/searches. Latest week {trend.latestWeekVolume.toLocaleString()} vs
				{trend.previousWeekVolume.toLocaleString()} the week before.
			</p>
			{#if detail.weekly.length}
				<div class="mt-4 flex items-end gap-2 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
					{#each detail.weekly as w (w.week)}
						<div class="flex flex-1 flex-col items-center gap-1">
							<span class="text-xs font-semibold">{w.volume.toLocaleString()}</span>
							<div
								class="w-full rounded-t bg-rose-900/80"
								style="height: {Math.max(4, (w.volume / maxWeekVolume) * 140)}px"
							></div>
							<span class="text-[11px] text-stone-500">{w.week.slice(5)}</span>
						</div>
					{/each}
				</div>
			{:else}
				<p class="mt-4 rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-500 shadow-sm">
					Weekly volumes are not available from the backend for this trend yet.
				</p>
			{/if}
		</section>

		<!-- Source breakdown -->
		<section>
			<h2 class="text-lg font-bold">Which sources are driving it</h2>
			<p class="mt-1 text-sm text-stone-500">
				Cross-source confirmation is the strongest signal: the more categories independently
				observing a trend, the more real it is.
			</p>
			{#if detail.breakdown.length}
				<div class="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
					<table class="w-full min-w-[640px] text-left text-sm">
						<thead>
							<tr class="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
								<th class="px-4 py-3 font-semibold">Source category</th>
								<th class="px-4 py-3 font-semibold">Sources</th>
								<th class="px-4 py-3 font-semibold">Volume</th>
								<th class="px-4 py-3 font-semibold">Share</th>
								<th class="px-4 py-3 font-semibold">Sentiment</th>
							</tr>
						</thead>
						<tbody>
							{#each detail.breakdown as b (b.category)}
								<tr class="border-b border-stone-100 last:border-0">
									<td class="px-4 py-3 font-semibold">{CATEGORY_LABELS[b.category] ?? b.category}</td>
									<td class="px-4 py-3 text-stone-500">{b.sources.join(', ')}</td>
									<td class="px-4 py-3">{b.volume.toLocaleString()}</td>
									<td class="px-4 py-3">{Math.round(b.volumeShare * 100)}%</td>
									<td class="px-4 py-3">
										{b.avgSentiment >= 0 ? '+' : ''}{b.avgSentiment.toFixed(2)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<p class="mt-4 rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-500 shadow-sm">
					Per-source breakdown is not available from the backend for this trend yet.
				</p>
			{/if}
			<p class="mt-3 text-xs text-stone-500">
				Data as of {asOfLabel} · v1 seed data, curated — see the methodology page for limitations.
			</p>
		</section>
	{/if}
</div>
