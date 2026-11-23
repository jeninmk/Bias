import Link from "next/link";
import { notFound } from "next/navigation";
import { STAGE_LABELS, STAGE_STYLES } from "@/engine/lifecycle";
import type { SourceCategory } from "@/engine/types";
import {
  AS_OF,
  getRankedTrends,
  getRawTerms,
  getSourceBreakdown,
  getTrendBySlug,
  getWeeklyVolumes,
  slugify,
} from "@/lib/trends";

const CATEGORY_LABELS: Record<SourceCategory, string> = {
  tiktok: "TikTok",
  twitter: "X / Twitter",
  instagram: "Instagram",
  pinterest: "Pinterest",
  resale: "Resale demand",
  runway: "Runway",
  editorial: "Editorial",
  "color-authority": "Color authority",
  search: "Search",
  retail: "Retail new-in",
  lyst: "Lyst Index",
  celebrity: "Celebrity / street style",
  reddit: "Reddit",
  music: "Music / festivals",
  youtube: "YouTube",
  "ecommerce-search": "E-commerce search",
  "trend-service": "Trend services",
};

export async function generateStaticParams() {
  const ranked = await getRankedTrends();
  return ranked.map((t) => ({ slug: slugify(t.canonicalAttribute) }));
}

function formatPercent(rate: number): string {
  const pct = Math.round(rate * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

function ScoreBar({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-200">
        <span
          className="block h-full rounded-full bg-rose-900"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-stone-500">{hint}</p>
    </div>
  );
}

export default async function TrendDetail({
  params,
}: {
  params: { slug: string };
}) {
  const trend = await getTrendBySlug(params.slug);
  if (!trend) {
    notFound();
  }

  const [breakdown, weekly, rawTerms] = await Promise.all([
    getSourceBreakdown(trend.canonicalAttribute),
    getWeeklyVolumes(trend.canonicalAttribute),
    getRawTerms(trend.canonicalAttribute),
  ]);

  const maxWeekVolume = Math.max(1, ...weekly.map((w) => w.volume));
  const s = trend.score;
  const peak = trend.forecast;
  const peakLabel =
    peak.weeksToPeak === 0
      ? "Already peaked"
      : `Peak in ~${peak.peakWindowStartWeeks}–${peak.peakWindowEndWeeks} weeks`;

  return (
    <div className="space-y-10">
      <Link href="/" className="text-sm font-medium text-stone-500 hover:text-rose-900">
        ← Back to dashboard
      </Link>

      {/* Header */}
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
            {trend.attributeType}
          </p>
          <h1 className="mt-1 text-4xl font-black capitalize tracking-tight">
            {trend.canonicalAttribute}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
            Seen as {rawTerms.map((t) => `“${t}”`).join(", ")} across{" "}
            {trend.sourceCategories.length} source categories, from{" "}
            {trend.observationCount} observations over 8 weeks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${STAGE_STYLES[trend.stage]}`}
          >
            {STAGE_LABELS[trend.stage]}
          </span>
          <div className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-center shadow-sm">
            <p className="text-2xl font-black leading-none">{s.trendScore}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-stone-500">
              Trend Score
            </p>
          </div>
        </div>
      </section>

      {/* Forecast */}
      <section className="rounded-xl border border-rose-900/20 bg-rose-50 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-rose-900">
          Forecast
        </h2>
        <p className="mt-2 text-lg font-semibold">{peakLabel}</p>
        <p className="mt-1 text-sm text-stone-600">
          Projected peak score {peak.estimatedPeakScore} · velocity{" "}
          {formatPercent(trend.velocityRate)} week over week
          {trend.accelerationRate !== 0 &&
            ` (${trend.accelerationRate > 0 ? "accelerating" : "decelerating"} by ${Math.abs(
              Math.round(trend.accelerationRate * 100),
            )} pts)`}{" "}
          · confidence {s.confidence}/100.
        </p>
      </section>

      {/* Score breakdown */}
      <section>
        <h2 className="text-lg font-bold">Score breakdown</h2>
        <p className="mt-1 text-sm text-stone-500">
          Trend Score = 0.30·velocity + 0.20·volume + 0.20·breadth +
          0.10·sentiment + 0.10·resale + 0.10·authority. Each component is
          normalized to 0–100 first.
        </p>
        <div className="mt-4 grid gap-5 rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-2">
          <ScoreBar
            label="Velocity"
            value={s.velocity}
            hint={`Week-over-week growth ${formatPercent(trend.velocityRate)}.`}
          />
          <ScoreBar
            label="Volume"
            value={s.volume}
            hint={`Decayed total volume ${trend.totalVolume.toLocaleString()}, log-normalized vs the dataset max.`}
          />
          <ScoreBar
            label="Breadth"
            value={s.breadth}
            hint={`${trend.sourceCategories.length} of 17 source categories are observing this trend.`}
          />
          <ScoreBar
            label="Sentiment"
            value={s.sentiment}
            hint="Volume-weighted average sentiment over the last 4 weeks."
          />
          <ScoreBar
            label="Resale"
            value={s.resale}
            hint="Resale price premium vs retail plus sell-through. 50 when no resale data exists."
          />
          <ScoreBar
            label="Authority"
            value={s.authority}
            hint="Share of recent volume from runway, editorial, and color-authority sources."
          />
        </div>
      </section>

      {/* Weekly curve */}
      <section>
        <h2 className="text-lg font-bold">Weekly volume</h2>
        <p className="mt-1 text-sm text-stone-500">
          Raw weekly mentions/searches. Latest week{" "}
          {trend.latestWeekVolume.toLocaleString()} vs{" "}
          {trend.previousWeekVolume.toLocaleString()} the week before.
        </p>
        <div className="mt-4 flex items-end gap-2 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          {weekly.map((w) => (
            <div key={w.week} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-semibold">
                {w.volume.toLocaleString()}
              </span>
              <div
                className="w-full rounded-t bg-rose-900/80"
                style={{
                  height: `${Math.max(4, (w.volume / maxWeekVolume) * 140)}px`,
                }}
              />
              <span className="text-[11px] text-stone-500">
                {w.week.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Source breakdown */}
      <section>
        <h2 className="text-lg font-bold">Which sources are driving it</h2>
        <p className="mt-1 text-sm text-stone-500">
          Cross-source confirmation is the strongest signal: the more
          categories independently observing a trend, the more real it is.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                <th className="px-4 py-3 font-semibold">Source category</th>
                <th className="px-4 py-3 font-semibold">Sources</th>
                <th className="px-4 py-3 font-semibold">Volume</th>
                <th className="px-4 py-3 font-semibold">Share</th>
                <th className="px-4 py-3 font-semibold">Sentiment</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((b) => (
                <tr
                  key={b.category}
                  className="border-b border-stone-100 last:border-0"
                >
                  <td className="px-4 py-3 font-semibold">
                    {CATEGORY_LABELS[b.category]}
                  </td>
                  <td className="px-4 py-3 text-stone-500">
                    {b.sources.join(", ")}
                  </td>
                  <td className="px-4 py-3">{b.volume.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {Math.round(b.volumeShare * 100)}%
                  </td>
                  <td className="px-4 py-3">
                    {b.avgSentiment >= 0 ? "+" : ""}
                    {b.avgSentiment.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-stone-500">
          Data as of {AS_OF.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} ·
          v1 seed data, curated — see the methodology page for limitations.
        </p>
      </section>
    </div>
  );
}
