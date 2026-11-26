<script lang="ts">
	import {
		CATEGORY_LABELS,
		COLOR_HEX,
		bandForScore,
		formatPercent,
		slugify
	} from '$lib/trends';
	import type { ScoredTrend } from '$lib/types';

	export let trend: ScoredTrend;
	export let rank: number;
	export let featured = false;

	$: band = bandForScore(trend.score.trendScore);
	$: cover = trend.coverImage;
	$: isColor = trend.attributeType === 'color';
	$: hex = COLOR_HEX[trend.canonicalAttribute];
	$: seenIn = trend.sourceCategories.slice(0, 3).map((c) => CATEGORY_LABELS[c] ?? c);
	$: staying = trend.stayingPower;
	$: streakLine =
		staying && staying.weeksInTop5 > 0
			? `${staying.weeksInTop5} ${staying.weeksInTop5 === 1 ? 'week' : 'weeks'} in the Top 5`
			: staying && staying.currentStreakWeeks > 1
				? `${staying.currentStreakWeeks} week Top 10 streak`
				: staying && staying.weeksInTop10 > 0
					? `${staying.weeksInTop10} ${staying.weeksInTop10 === 1 ? 'week' : 'weeks'} in the Top 10`
					: null;
</script>

<a
	href="/trends/{slugify(trend.canonicalAttribute)}"
	class="group block overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:border-rose-900"
>
	<div class="relative">
		{#if cover}
			<img
				src={cover.imageUrl}
				alt={cover.articleTitle ?? trend.canonicalAttribute}
				loading="lazy"
				class={featured ? 'aspect-[16/7] w-full object-cover' : 'aspect-[4/3] w-full object-cover'}
			/>
			<span
				class="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-stone-600"
			>
				Photo: {cover.source}
			</span>
		{:else if isColor && hex}
			<div
				class={featured ? 'aspect-[16/7] w-full' : 'aspect-[4/3] w-full'}
				style="background-color: {hex}"
			></div>
		{:else}
			<div
				class="{featured
					? 'aspect-[16/7]'
					: 'aspect-[4/3]'} flex w-full flex-col justify-end bg-stone-200 p-4"
			>
				<p class="text-xs font-semibold uppercase tracking-widest text-stone-500">
					{trend.attributeType}
				</p>
				<p
					class="{featured
						? 'text-5xl'
						: 'text-3xl'} font-black capitalize leading-none tracking-tight text-stone-800"
				>
					{trend.canonicalAttribute}
				</p>
			</div>
		{/if}
		<span
			class="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-stone-700"
		>
			#{rank}
		</span>
	</div>
	<div class="p-4">
		<div class="flex items-baseline justify-between gap-2">
			<h3 class="font-bold capitalize group-hover:text-rose-900 group-hover:underline {featured ? 'text-2xl' : 'text-lg'}">
				{trend.canonicalAttribute}
			</h3>
			<span class="shrink-0 text-2xl font-black text-rose-900">{trend.score.trendScore}</span>
		</div>
		<div class="mt-2 flex flex-wrap items-center gap-2">
			<span class="rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 {band.style}">
				{band.label}
			</span>
			{#if streakLine}
				<span class="text-xs font-medium text-stone-500">{streakLine}</span>
			{/if}
		</div>
		<p class="mt-2 text-xs leading-relaxed text-stone-500">
			{#if seenIn.length}
				Seen in {seenIn.join(', ')}
			{/if}
			{#if trend.velocityRate !== 0}
				{' · '}
				<span class="font-semibold {trend.velocityRate >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
					{formatPercent(trend.velocityRate)}
				</span>
				week over week
			{/if}
		</p>
	</div>
</a>
