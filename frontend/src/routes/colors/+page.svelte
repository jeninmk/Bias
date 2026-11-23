<script lang="ts">
	import BackendError from '$lib/components/BackendError.svelte';
	import { COLOR_HEX, PANTONE_COTY_2025, STAGE_LABELS, STAGE_STYLES, slugify } from '$lib/trends';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="space-y-10">
	<section>
		<p class="text-xs font-semibold uppercase tracking-widest text-rose-900">Color intelligence</p>
		<h1 class="mt-2 text-4xl font-black tracking-tight">The palette</h1>
		<p class="mt-3 max-w-2xl text-base leading-relaxed text-stone-600">
			Colors run longer than any other trend type — a typical color lifecycle is about 10 weeks,
			against 6 for a single item. The strongest early signal for a color is the color
			authorities: Pantone&apos;s seasonal reports and WGSN forecasts, confirmed by runway look
			counts.
		</p>
	</section>

	{#if data.error}
		<BackendError message={data.error} apiBase={data.apiBase} />
	{/if}

	{#if data.colors.length === 0 && !data.error}
		<p class="text-sm text-stone-500">No color trends returned yet.</p>
	{/if}

	{#if data.colors.length}
		<section class="grid gap-5 sm:grid-cols-3">
			{#each data.colors as t (t.canonicalAttribute)}
				<a
					href="/trends/{slugify(t.canonicalAttribute)}"
					class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:border-rose-900"
				>
					<div
						class="h-28 w-full"
						style="background-color: {COLOR_HEX[t.canonicalAttribute] ?? '#888888'}"
					></div>
					<div class="p-4">
						<div class="flex items-center justify-between gap-2">
							<h2 class="font-bold capitalize">{t.canonicalAttribute}</h2>
							<span class="rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 {STAGE_STYLES[t.stage]}">
								{STAGE_LABELS[t.stage]}
							</span>
						</div>
						<p class="mt-2 text-sm text-stone-600">
							Score <span class="font-bold text-stone-900">{t.score.trendScore}</span>
							{' · '}velocity
							<span class="font-semibold {t.velocityRate >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
								{t.velocityRate >= 0 ? '+' : ''}{Math.round(t.velocityRate * 100)}%
							</span>
							{' · '}breadth {t.sourceCategories.length}/17
						</p>
						<p class="mt-1 text-sm text-stone-600">
							{t.forecast.weeksToPeak === 0
								? 'Already peaked'
								: `Projected peak in ~${t.forecast.peakWindowStartWeeks}–${t.forecast.peakWindowEndWeeks} weeks`}
						</p>
					</div>
				</a>
			{/each}
		</section>
	{/if}

	<!-- Pantone context -->
	<section class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
		<h2 class="text-lg font-bold">Color authority context</h2>
		<div class="mt-3 flex items-center gap-4">
			<div
				class="h-16 w-16 shrink-0 rounded-lg ring-1 ring-stone-200"
				style="background-color: {PANTONE_COTY_2025.hex}"
			></div>
			<div>
				<p class="font-semibold">
					Pantone Color of the Year {PANTONE_COTY_2025.year}: {PANTONE_COTY_2025.name}
				</p>
				<p class="mt-1 text-sm leading-relaxed text-stone-600">
					Pantone announces each year&apos;s Color of the Year in December, alongside seasonal
					Fashion Color Trend Reports for New York and London fashion weeks. A seasonal Pantone
					pick that also shows up in runway look counts is one of the strongest early signals
					in the whole engine — it is why color authority carries its own scoring weight. The
					2026 Color of the Year is announced in December 2026; this page will update when it
					lands.
				</p>
			</div>
		</div>
	</section>
</div>
