<script lang="ts">
	import type { WeeklyVolume } from '$lib/types';

	export let weekly: WeeklyVolume[];

	const W = 640;
	const H = 220;
	const PAD_X = 36;
	const PAD_TOP = 24;
	const PAD_BOTTOM = 30;

	$: volumes = weekly.map((w) => w.volume);
	$: max = Math.max(1, ...volumes);
	$: min = Math.min(0, ...volumes);
	$: span = max - min || 1;
	$: points = weekly.map((w, i) => {
		const x = PAD_X + (i * (W - PAD_X * 2)) / Math.max(1, weekly.length - 1);
		const y = H - PAD_BOTTOM - ((w.volume - min) / span) * (H - PAD_TOP - PAD_BOTTOM);
		return { x, y, week: w.week, volume: w.volume };
	});
	$: line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
	$: area =
		points.length > 0
			? `${line} L${points[points.length - 1].x.toFixed(1)},${H - PAD_BOTTOM} L${points[0].x.toFixed(1)},${H - PAD_BOTTOM} Z`
			: '';
	$: first = points[0];
	$: last = points[points.length - 1];
	$: change =
		first && last && first.volume > 0
			? Math.round(((last.volume - first.volume) / first.volume) * 100)
			: null;
</script>

{#if points.length > 1}
	<div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
		<svg viewBox="0 0 {W} {H}" class="w-full" role="img" aria-label="Weekly volume line chart">
			{#each [0.25, 0.5, 0.75] as frac}
				<line
					x1={PAD_X}
					x2={W - PAD_X}
					y1={PAD_TOP + frac * (H - PAD_TOP - PAD_BOTTOM)}
					y2={PAD_TOP + frac * (H - PAD_TOP - PAD_BOTTOM)}
					stroke="#e7e5e4"
					stroke-width="1"
				/>
			{/each}
			<path d={area} fill="#881337" fill-opacity="0.08" />
			<path d={line} fill="none" stroke="#881337" stroke-width="2.5" stroke-linejoin="round" />
			{#each points as p, i}
				{#if i === 0 || i === points.length - 1}
					<circle cx={p.x} cy={p.y} r="4" fill="#881337" />
					<text x={p.x} y={p.y - 10} text-anchor="middle" font-size="12" font-weight="700" fill="#1c1917">
						{p.volume.toLocaleString()}
					</text>
					<text x={p.x} y={H - 10} text-anchor="middle" font-size="11" fill="#78716c">
						{p.week.slice(5)}
					</text>
				{:else if i % 2 === 0}
					<text x={p.x} y={H - 10} text-anchor="middle" font-size="11" fill="#78716c">
						{p.week.slice(5)}
					</text>
				{/if}
			{/each}
		</svg>
		<p class="mt-2 text-sm text-stone-600">
			{#if change !== null}
				<span class="font-semibold {change >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
					{change >= 0 ? '+' : ''}{change}%</span
				>
				since the first week shown.
			{:else}
				Weekly mentions and searches.
			{/if}
		</p>
	</div>
{:else}
	<p class="rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-500 shadow-sm">
		Weekly volumes are not available from the backend for this trend yet.
	</p>
{/if}
