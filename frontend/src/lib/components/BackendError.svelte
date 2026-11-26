<script lang="ts">
	export let message: string;
	export let apiBase: string;
</script>

<div class="rounded-xl border border-amber-200 bg-amber-50 p-5" role="alert">
	<h2 class="text-sm font-bold uppercase tracking-wide text-amber-900">Backend not reachable</h2>
	<p class="mt-2 text-sm leading-relaxed text-stone-700">
		{message} Start the FastAPI server and reload this page.
	</p>
	<p class="mt-1 font-mono text-xs text-stone-500">
		Expected API base: {apiBase}
	</p>
</div>
