<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="space-y-10">
	<section>
		<p class="text-xs font-semibold uppercase tracking-widest text-rose-900">How it works</p>
		<h1 class="mt-2 text-4xl font-black tracking-tight">Methodology</h1>
		<p class="mt-3 max-w-2xl text-base leading-relaxed text-stone-600">
			Bias watches one thing at a time: a color, a pattern, a silhouette, an item, a fabric, or an aesthetic. Then it asks a simple question: is it about to peak? Every trend on this
			site gets a Trend Score from 0 to 100, built from what people are actually watching,
			wearing, searching for, and paying for right now.
		</p>
		{#if data.backendError}
			<p class="mt-3 text-xs text-stone-500">
				Showing the built-in methodology copy. The backend ({data.backendError}) is not reachable right now.
			</p>
		{/if}
	</section>

	<!-- Where we look -->
	<section>
		<h2 class="text-lg font-bold">Where we look</h2>
		<p class="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
			Seventeen kinds of sources, because no single feed tells the truth about a trend. A
			hashtag on TikTok, a look on the runway, and a sold listing on Depop all count. A
			trend that shows up in lots of different places at once counts for more than one
			that&apos;s loud in a single corner.
		</p>
		<div class="mt-4 grid gap-5 sm:grid-cols-2">
			<div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
				<h3 class="font-bold">Social &amp; video</h3>
				<ul class="mt-2 space-y-1 text-sm leading-relaxed text-stone-600">
					<li>
						TikTok: trending hashtags <strong class="text-stone-900">#fashiontok</strong> and
						<strong class="text-stone-900">#ootd</strong>, captions, and comments
					</li>
					<li>Instagram: Reels, hashtags, and influencer posts</li>
					<li>YouTube: hauls, trend roundups, and try-ons</li>
					<li>X (Twitter): hashtags, mentions, and quote posts</li>
					<li>Pinterest: popular pins, board saves, and search trends</li>
				</ul>
			</div>
			<div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
				<h3 class="font-bold">The fashion world</h3>
				<ul class="mt-2 space-y-1 text-sm leading-relaxed text-stone-600">
					<li>
						Runway: Vogue Runway and the New York, London, Milan, and Paris fashion weeks
					</li>
					<li>
						Editorial: Vogue, ELLE, Harper&apos;s Bazaar, Business of Fashion, WWD, Hypebeast,
						Highsnobiety, The Cut, and Who What Wear
					</li>
					<li>Pantone&apos;s Color of the Year and seasonal color reports</li>
					<li>The Lyst Index</li>
				</ul>
			</div>
			<div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
				<h3 class="font-bold">What people actually buy</h3>
				<ul class="mt-2 space-y-1 text-sm leading-relaxed text-stone-600">
					<li>
						Resale: Depop, ThredUp, Vinted, Poshmark, eBay, and Grailed: what things sell
						for, and how fast they sell
					</li>
					<li>New arrivals: Zara, H&amp;M, ASOS, SSENSE, Net-a-Porter, and Shopbop</li>
					<li>Shopping search: ShopStyle and Lyst</li>
				</ul>
			</div>
			<div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
				<h3 class="font-bold">The conversation</h3>
				<ul class="mt-2 space-y-1 text-sm leading-relaxed text-stone-600">
					<li>Reddit: r/femalefashionadvice, r/streetwear, and r/fashion</li>
					<li>Celebrity and street style</li>
					<li>Music and festival culture</li>
					<li>Search interest: Google Trends and Pinterest Trends</li>
					<li>Runway search data: Tagwalk and Heuritech</li>
				</ul>
			</div>
		</div>
		<p class="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600">
			The same trend can wear different names. Burgundy on TikTok, cherry red on Depop,
			oxblood on the runway. We count them as one trend.
		</p>
	</section>

	<!-- How a score comes together -->
	<section>
		<h2 class="text-lg font-bold">How a score comes together</h2>
		<p class="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
			Each trend is scored 0 to 100 on six things, then combined into a single Trend Score. The
			exact recipe is ours, but here&apos;s what goes into it, in plain words:
		</p>
		<div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			<div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
				<h3 class="font-bold">Momentum</h3>
				<p class="mt-1 text-sm leading-relaxed text-stone-600">
					Is it picking up speed, week over week?
				</p>
			</div>
			<div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
				<h3 class="font-bold">Volume</h3>
				<p class="mt-1 text-sm leading-relaxed text-stone-600">
					How much are people talking about it and searching for it?
				</p>
			</div>
			<div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
				<h3 class="font-bold">Breadth</h3>
				<p class="mt-1 text-sm leading-relaxed text-stone-600">
					How many different kinds of sources are seeing it?
				</p>
			</div>
			<div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
				<h3 class="font-bold">Sentiment</h3>
				<p class="mt-1 text-sm leading-relaxed text-stone-600">
					Do people like it, or just argue about it?
				</p>
			</div>
			<div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
				<h3 class="font-bold">Resale</h3>
				<p class="mt-1 text-sm leading-relaxed text-stone-600">
					Are people paying more than retail for it secondhand?
				</p>
			</div>
			<div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
				<h3 class="font-bold">Authority</h3>
				<p class="mt-1 text-sm leading-relaxed text-stone-600">
					Did the runway and the editors get there first?
				</p>
			</div>
		</div>
		<p class="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600">
			Recent weeks count more than old ones, so a trend has to keep earning its score. And a
			score backed by lots of sightings across lots of sources is steadier than one built on a
			handful. Every trend shows how sure we are.
		</p>
	</section>

	<!-- Lifecycle + forecast -->
	<section class="grid gap-5 sm:grid-cols-2">
		<div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
			<h2 class="text-lg font-bold">A trend&apos;s life, in five stages</h2>
			<ul class="mt-3 space-y-2 text-sm leading-relaxed text-stone-600">
				<li>
					<strong class="text-stone-900">Emerging</strong>: small, growing fast, seen in just a
					few places.
				</li>
				<li>
					<strong class="text-stone-900">Rising</strong>: gaining ground: more mentions, more
					places, more people.
				</li>
				<li>
					<strong class="text-stone-900">Peak</strong>: everywhere at once, and leveling off.
				</li>
				<li>
					<strong class="text-stone-900">Declining</strong>: cooling down, week over week.
				</li>
				<li><strong class="text-stone-900">Dead</strong>: gone quiet.</li>
			</ul>
		</div>
		<div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
			<h2 class="text-lg font-bold">When will it peak?</h2>
			<p class="mt-3 text-sm leading-relaxed text-stone-600">
				We estimate when each trend is likely to peak. Colors and aesthetics usually take
				longer to play out than a single item, so their windows run wider. A trend
				that&apos;s already declining has already peaked.
			</p>
		</div>
	</section>

	<!-- What the data is -->
	<section class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
		<h2 class="text-lg font-bold">What the data is right now</h2>
		<p class="mt-3 text-sm leading-relaxed text-stone-600">
			Right now the scores come from a curated seed dataset: 433 observations across 12
			trends and 8 weeks, gathered by hand from the sources above. The first live feed,
			editorial headlines, is being connected now. The social platforms need approved access
			before they can stream in, and we don&apos;t scrape sites that don&apos;t allow it. As live
			feeds come online, the same scores will be computed from fresher data.
		</p>
	</section>

	<!-- Honest limits -->
	<section class="rounded-xl border border-amber-200 bg-amber-50 p-5">
		<h2 class="text-lg font-bold">Worth knowing</h2>
		<ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-700">
			<li>
				Trends are directional, not certain. A score is a read on momentum, not a promise.
			</li>
			<li>
				A TikTok view and a runway look aren&apos;t the same unit, so volume is a guide, not a
				count.
			</li>
			<li>
				Feeling is a rough average. It can&apos;t tell “people love wearing it” from “people
				love arguing about it.”
			</li>
			<li>Resale data is still thin. Where it&apos;s missing, it doesn&apos;t move the score either way.</li>
			<li>
				No seasonality yet: a trend peaking in November might be a fall thing rather than a
				lasting shift.
			</li>
			<li>Not buying advice.</li>
		</ul>
	</section>
</div>
