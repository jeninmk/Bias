<script lang="ts">
	import '../app.css';
</script>

<div class="min-h-screen bg-stone-50 text-stone-900 antialiased">
	<header class="border-b border-stone-200 bg-white">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
			<a href="/" class="flex items-baseline gap-2">
				<span class="text-xl font-black tracking-tight">Bias</span>
				<span class="hidden text-xs font-medium uppercase tracking-widest text-stone-500 sm:inline">
					The bias cut in fashion meets bias in data
				</span>
			</a>
			<nav class="flex items-center gap-5 text-sm font-medium">
				<a href="/" class="hover:text-rose-900">Dashboard</a>
				<a href="/colors" class="hover:text-rose-900">Colors</a>
				<a href="/methodology" class="hover:text-rose-900">Methodology</a>
			</nav>
		</div>
	</header>

	<main class="mx-auto min-h-screen max-w-6xl px-6 py-8">
		<slot />
	</main>

	<footer class="border-t border-stone-200 bg-white">
		<div
			class="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between"
		>
			<span>
				Bias — scores computed from a curated seed dataset of 433 observations across 12 trends
				and 8 weeks.
			</span>
			<span>Not buying advice. Trends are directional, not certain.</span>
		</div>
	</footer>
</div>
