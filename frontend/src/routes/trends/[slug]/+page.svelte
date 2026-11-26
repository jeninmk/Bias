<script lang="ts">
	import BackendError from '$lib/components/BackendError.svelte';
	import VolumeChart from '$lib/components/VolumeChart.svelte';
	import {
		CATEGORY_LABELS,
		COLOR_HEX,
		SIGNAL_LABELS,
		STAGE_LABELS,
		STAGE_STYLES,
		bandForScore,
		formatPercent
	} from '$lib/trends';
	import type { PageData } from './$types';

	export let data: PageData;

	$: detail = data.detail;
	$: trend = detail?.trend;
	$: band = trend ? bandForScore(trend.score.trendScore) : null;
	$: peakLabel = !trend
		? ''
		: trend.forecast.weeksToPeak === 0
			? 'Already peaked'
			: `Peak in about ${trend.forecast.peakWindowStartWeeks} to ${trend.forecast.peakWindowEndWeeks} weeks`;
	$: asOfLabel = new Date('2026-11-23T12:00:00Z').toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
	$: staying = trend?.stayingPower ?? null;
	$: stayingLine =
		staying && staying.weeksInTop5 > 0
			? `${staying.weeksInTop5} ${staying.weeksInTop5 === 1 ? 'week' : 'weeks'} in the Top 5`
			: staying && staying.weeksInTop10 > 0
				? `${staying.weeksInTop10} ${staying.weeksInTop10 === 1 ? 'week' : 'weeks'} in the Top 10`
				: null;
</script>

<div class="space-y-10">
	<a href="/" class="text-sm font-medium text-stone-500 hover:text-rose-900">Back to the rack</a>

	{#if data.error}
		<BackendError message={data.error} apiBase={data.apiBase} />
	{/if}

	{#if trend && detail}
		<!-- Cover -->
		{#if trend.coverImage}
			<figure>
				<img
					src={trend.coverImage.imageUrl}
					alt={trend.coverImage.articleTitle ?? trend.canonicalAttribute}
					class="aspect-[16/7] w-full rounded-xl object-cover shadow-sm"
				/>
				<figcaption class="mt-2 text-xs text-stone-500">
					Photo: {trend.coverImage.source}
					{#if trend.coverImage.articleTitle && trend.coverImage.articleUrl}
						{' · '}
						<a
							href={trend.coverImage.articleUrl}
							target="_blank"
							rel="noreferrer"
							class="font-medium text-rose-900 hover:underline"
						>
							{trend.coverImage.articleTitle}
						</a>
					{/if}
				</figcaption>
			</figure>
		{:else if trend.attributeType === 'color' && COLOR_HEX[trend.canonicalAttribute]}
			<div
				class="aspect-[16/7] w-full rounded-xl shadow-sm"
				style="background-color: {COLOR_HEX[trend.canonicalAttribute]}"
			></div>
		{/if}

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
				{#if band && band.label !== STAGE_LABELS[trend.stage]}
					<span class="rounded-full px-3 py-1 text-sm font-semibold ring-1 {band.style}">
						{band.label}
					</span>
				{/if}
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
				Projected peak score {trend.forecast.estimatedPeakScore} · momentum
				{formatPercent(trend.velocityRate)} week over week
				{#if trend.accelerationRate !== 0}
					({trend.accelerationRate > 0 ? 'accelerating' : 'decelerating'} by {Math.abs(
						Math.round(trend.accelerationRate * 100)
					)} pts)
				{/if}
				· confidence {trend.score.confidence}/100.
			</p>
		</section>

		<!-- Staying power -->
		{#if stayingLine}
			<section class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
				<h2 class="text-sm font-bold uppercase tracking-wide text-stone-700">Staying power</h2>
				<p class="mt-2 text-lg font-semibold">{stayingLine}</p>
				<p class="mt-1 text-sm text-stone-600">
					{#if staying}
						{staying.weeksInTop10}
						{staying.weeksInTop10 === 1 ? 'week' : 'weeks'} in the Top 10 in total
						{#if staying.currentStreakWeeks > 1}
							, including a {staying.currentStreakWeeks} week streak right now
						{/if}
						. A trend that keeps returning to the top ranks is steadier than one that
						flashes once and fades.
					{/if}
				</p>
			</section>
		{/if}

		<!-- Score breakdown -->
		<section>
			<h2 class="text-lg font-bold">Score breakdown</h2>
			<p class="mt-1 text-sm text-stone-500">
				Each component is scored 0 to 100, then combined into the Trend Score.
			</p>
			<div class="mt-4 grid gap-5 rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-2">
				{#each [
					{ label: SIGNAL_LABELS.velocity, value: trend.score.velocity, hint: `Week-over-week growth ${formatPercent(trend.velocityRate)}.` },
					{ label: SIGNAL_LABELS.volume, value: trend.score.volume, hint: `Decayed total volume ${trend.totalVolume.toLocaleString()}.` },
					{ label: SIGNAL_LABELS.breadth, value: trend.score.breadth, hint: `${trend.sourceCategories.length} of 17 source categories are observing this trend.` },
					{ label: SIGNAL_LABELS.sentiment, value: trend.score.sentiment, hint: 'How people feel about it, from recent mentions.' },
					{ label: SIGNAL_LABELS.resale, value: trend.score.resale, hint: 'Resale price premium vs retail plus sell-through. 50 when no resale data exists.' },
					{ label: SIGNAL_LABELS.authority, value: trend.score.authority, hint: 'Share of recent volume from runway, editorial, and color-authority sources.' }
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
				Raw weekly mentions and searches. Latest week {trend.latestWeekVolume.toLocaleString()} vs
				{trend.previousWeekVolume.toLocaleString()} the week before.
			</p>
			<div class="mt-4">
				<VolumeChart weekly={detail.weekly} />
			</div>
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
				Data as of {asOfLabel} · v1 seed data, curated. See the methodology page for limitations.
			</p>
		</section>
	{/if}
</div>
