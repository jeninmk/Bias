export default function MethodologyPage() {
  return (
    <div className="space-y-10">
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-rose-900">
          How it works
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">
          Methodology
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-600">
          A trend candidate is one attribute — a color, pattern,
          silhouette, item, fabric, or aesthetic. Every signal below is
          computed from observations of that attribute across 17 source
          categories, over rolling weekly windows.
        </p>
      </section>

      {/* Formula */}
      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">The scoring formula</h2>
        <p className="mt-3 rounded-lg bg-stone-100 px-4 py-3 font-mono text-sm leading-relaxed">
          Trend Score = 0.30·velocity + 0.20·volume + 0.20·breadth +
          0.10·sentiment + 0.10·resale + 0.10·authority
        </p>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          Each component is normalized to 0–100 <em>before</em> weighting,
          so no signal dominates through raw units. Confidence is separate:
          0.5 × observation-count score + 0.5 × source diversity, so a
          score built on 30 observations across 9 sources is trusted more
          than one built on 4 observations from 1 source.
        </p>
      </section>

      {/* Signals */}
      <section>
        <h2 className="text-lg font-bold">The signals</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                <th className="px-4 py-3 font-semibold">Signal</th>
                <th className="px-4 py-3 font-semibold">What it measures</th>
                <th className="px-4 py-3 font-semibold">How it normalizes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              <tr>
                <td className="px-4 py-3 font-semibold">Velocity</td>
                <td className="px-4 py-3 text-stone-600">Week-over-week growth of the latest complete week.</td>
                <td className="px-4 py-3 text-stone-600">0% growth → 50; +50% → 100; −50% → 0.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold">Volume</td>
                <td className="px-4 py-3 text-stone-600">Total mentions/searches, decayed by recency.</td>
                <td className="px-4 py-3 text-stone-600">Log scale vs the highest-volume trend in the dataset.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold">Breadth</td>
                <td className="px-4 py-3 text-stone-600">Distinct source categories observing the trend.</td>
                <td className="px-4 py-3 text-stone-600">Categories / 17 × 100. Cross-source confirmation is the strongest signal.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold">Sentiment</td>
                <td className="px-4 py-3 text-stone-600">Positive share of social mentions, last 4 weeks.</td>
                <td className="px-4 py-3 text-stone-600">Volume-weighted average sentiment mapped from [−1, 1] to [0, 100].</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold">Resale</td>
                <td className="px-4 py-3 text-stone-600">Resale price premium vs retail, plus sell-through rate.</td>
                <td className="px-4 py-3 text-stone-600">0.6 × premium + 0.4 × sell-through. 50 (neutral) when no resale data exists.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold">Authority</td>
                <td className="px-4 py-3 text-stone-600">Share of recent volume from runway, editorial, and color-authority sources.</td>
                <td className="px-4 py-3 text-stone-600">Share × 200, capped at 100 — early signals matter more than their raw volume.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold">Recency</td>
                <td className="px-4 py-3 text-stone-600">Exponential decay on older observations.</td>
                <td className="px-4 py-3 text-stone-600">14-day half-life: half weight after 14 days, a quarter after 28. Velocity uses raw weekly volumes so decay does not distort growth.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold">Acceleration</td>
                <td className="px-4 py-3 text-stone-600">Change in velocity vs the previous week.</td>
                <td className="px-4 py-3 text-stone-600">Shown on trend pages; feeds the lifecycle read, not the score directly.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Lifecycle + forecast */}
      <section className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Lifecycle stages</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-stone-600">
            <li><strong className="text-stone-900">Emerging</strong> — low volume, high velocity, low breadth. Seen on a few sources, growing fast.</li>
            <li><strong className="text-stone-900">Rising</strong> — volume and breadth both growing. The default for positive velocity.</li>
            <li><strong className="text-stone-900">Peak</strong> — high volume, velocity flattening toward zero.</li>
            <li><strong className="text-stone-900">Declining</strong> — negative velocity, week over week.</li>
            <li><strong className="text-stone-900">Dead</strong> — very low volume and still falling.</li>
          </ul>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Peak forecast</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            Weeks to peak = typical lifecycle × (1 − relative volume).
            Typical lifecycles: color 10 weeks, pattern 8, silhouette 8,
            item 6, fabric 8, aesthetic 12. Colors and aesthetics run
            longer than micro-trends on single items. The window is wider
            for slow-burn types (+3 weeks) and narrower for fast ones (+2).
            Declining and dead trends have already peaked.
          </p>
        </div>
      </section>

      {/* Normalization */}
      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Normalization</h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          A synonym map collapses raw terms to one canonical family, so
          “burgundy” on TikTok, “cherry red” on Depop, and “oxblood” on
          the runway all count as the same trend. Both the raw term and
          the canonical family are kept on every observation.
        </p>
      </section>

      {/* Limitations */}
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-lg font-bold">Limitations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-700">
          <li>v1 data is curated seed data, not live feeds. Scores describe the seed dataset until collectors are wired up.</li>
          <li>Volume is not comparable across source types — a TikTok view and a runway look are different units. Treat volume as directional.</li>
          <li>Sentiment is a blunt average; it does not distinguish “people love wearing it” from “people love arguing about it.”</li>
          <li>Resale data is thin, and a neutral 50 fills the gap where it is missing.</li>
          <li>The peak forecast is a heuristic, not a statistical model. Real trends plateau, revive, and die for unrelated reasons.</li>
          <li>No seasonality yet: a trend peaking in November may be a seasonal (fall color) rather than a durable shift.</li>
        </ul>
      </section>

      <p className="text-sm text-stone-500">
        Full specification: <code className="rounded bg-stone-100 px-1.5 py-0.5">docs/algorithm.md</code> ·
        source catalog and access notes: <code className="rounded bg-stone-100 px-1.5 py-0.5">docs/sources.md</code>
      </p>
    </div>
  );
}
