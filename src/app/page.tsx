import Link from "next/link";
import { STAGE_LABELS, STAGE_STYLES } from "@/engine/lifecycle";
import {
  AS_OF,
  getObservations,
  getRankedTrends,
  slugify,
} from "@/lib/trends";

function formatPercent(rate: number): string {
  const pct = Math.round(rate * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

export default async function Home() {
  const [ranked, observations] = await Promise.all([
    getRankedTrends(),
    getObservations(),
  ]);

  const categories = new Set(observations.map((o) => o.sourceCategory));
  const fastest = [...ranked]
    .sort((a, b) => b.velocityRate - a.velocityRate)
    .slice(0, 3);
  const asOfLabel = AS_OF.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-rose-900">
          Week of {asOfLabel}
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
          What&apos;s about to peak?
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-600">
          Twelve trend candidates scored from TikTok, the runway, resale
          demand, editorial, search, and more. The Trend Score blends
          growth, volume, cross-source breadth, sentiment, resale prices,
          and authority — then projects each trend&apos;s peak window.
        </p>
        <div className="mt-5 flex flex-wrap gap-6 text-sm">
          <span>
            <span className="font-bold">{ranked.length}</span>{" "}
            <span className="text-stone-500">trends tracked</span>
          </span>
          <span>
            <span className="font-bold">{observations.length}</span>{" "}
            <span className="text-stone-500">observations</span>
          </span>
          <span>
            <span className="font-bold">{categories.size}</span>{" "}
            <span className="text-stone-500">source categories live</span>
          </span>
          <span>
            <span className="font-bold">8</span>{" "}
            <span className="text-stone-500">weeks of data</span>
          </span>
        </div>
      </section>

      {/* Fastest risers */}
      <section>
        <h2 className="text-lg font-bold">Fastest risers</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {fastest.map((t) => (
            <Link
              key={t.canonicalAttribute}
              href={`/trends/${slugify(t.canonicalAttribute)}`}
              className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-rose-900"
            >
              <p className="text-2xl font-black text-rose-900">
                {formatPercent(t.velocityRate)}
              </p>
              <p className="mt-1 font-semibold capitalize">
                {t.canonicalAttribute}
              </p>
              <p className="text-xs text-stone-500">
                {STAGE_LABELS[t.stage]} · score {t.score.trendScore} ·
                breadth {t.sourceCategories.length}/17
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Ranking */}
      <section>
        <h2 className="text-lg font-bold">Ranking</h2>
        <p className="mt-1 text-sm text-stone-500">
          Ranked by Trend Score. Click a trend for its source breakdown,
          weekly curve, and projected peak window.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Trend</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold">Stage</th>
                <th className="px-4 py-3 font-semibold">Velocity</th>
                <th className="px-4 py-3 font-semibold">Breadth</th>
                <th className="px-4 py-3 font-semibold">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((t, i) => (
                <tr
                  key={t.canonicalAttribute}
                  className="border-b border-stone-100 last:border-0 hover:bg-stone-50"
                >
                  <td className="px-4 py-3 font-bold text-stone-400">
                    {i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/trends/${slugify(t.canonicalAttribute)}`}
                      className="font-semibold capitalize hover:text-rose-900 hover:underline"
                    >
                      {t.canonicalAttribute}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-stone-500">
                    {t.attributeType}
                  </td>
                  <td className="px-4 py-3">
                    <span className="mr-2 inline-block w-8 font-bold">
                      {t.score.trendScore}
                    </span>
                    <span className="inline-block h-2 w-20 overflow-hidden rounded-full bg-stone-200 align-middle">
                      <span
                        className="block h-full rounded-full bg-rose-900"
                        style={{ width: `${t.score.trendScore}%` }}
                      />
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STAGE_STYLES[t.stage]}`}
                    >
                      {STAGE_LABELS[t.stage]}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 font-semibold ${
                      t.velocityRate >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {formatPercent(t.velocityRate)}
                  </td>
                  <td className="px-4 py-3">
                    {t.sourceCategories.length}/17
                  </td>
                  <td className="px-4 py-3">{t.score.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
