import Link from "next/link";
import { STAGE_LABELS, STAGE_STYLES } from "@/engine/lifecycle";
import {
  COLOR_HEX,
  PANTONE_COTY_2025,
  getRankedTrends,
  slugify,
} from "@/lib/trends";

export default async function ColorsPage() {
  const ranked = await getRankedTrends();
  const colorTrends = ranked.filter((t) => t.attributeType === "color");

  return (
    <div className="space-y-10">
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-rose-900">
          Color intelligence
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">
          The palette
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-600">
          Colors run longer than any other trend type — a typical color
          lifecycle is about 10 weeks, against 6 for a single item. The
          strongest early signal for a color is the color authorities:
          Pantone&apos;s seasonal reports and WGSN forecasts, confirmed by
          runway look counts.
        </p>
      </section>

      {/* Color cards */}
      <section className="grid gap-5 sm:grid-cols-3">
        {colorTrends.map((t) => (
          <Link
            key={t.canonicalAttribute}
            href={`/trends/${slugify(t.canonicalAttribute)}`}
            className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:border-rose-900"
          >
            <div
              className="h-28 w-full"
              style={{
                backgroundColor: COLOR_HEX[t.canonicalAttribute] ?? "#888888",
              }}
            />
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-bold capitalize">
                  {t.canonicalAttribute}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STAGE_STYLES[t.stage]}`}
                >
                  {STAGE_LABELS[t.stage]}
                </span>
              </div>
              <p className="mt-2 text-sm text-stone-600">
                Score <span className="font-bold text-stone-900">{t.score.trendScore}</span>
                {" · "}velocity{" "}
                <span
                  className={`font-semibold ${
                    t.velocityRate >= 0
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  {t.velocityRate >= 0 ? "+" : ""}
                  {Math.round(t.velocityRate * 100)}%
                </span>
                {" · "}breadth {t.sourceCategories.length}/17
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {t.forecast.weeksToPeak === 0
                  ? "Already peaked"
                  : `Projected peak in ~${t.forecast.peakWindowStartWeeks}–${t.forecast.peakWindowEndWeeks} weeks`}
              </p>
            </div>
          </Link>
        ))}
      </section>

      {/* Pantone context */}
      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Color authority context</h2>
        <div className="mt-3 flex items-center gap-4">
          <div
            className="h-16 w-16 shrink-0 rounded-lg ring-1 ring-stone-200"
            style={{ backgroundColor: PANTONE_COTY_2025.hex }}
          />
          <div>
            <p className="font-semibold">
              Pantone Color of the Year {PANTONE_COTY_2025.year}:{" "}
              {PANTONE_COTY_2025.name}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">
              Pantone announces each year&apos;s Color of the Year in
              December, alongside seasonal Fashion Color Trend Reports for
              New York and London fashion weeks. A seasonal Pantone pick
              that also shows up in runway look counts is one of the
              strongest early signals in the whole engine — it is why
              color authority carries its own scoring weight. The 2026
              Color of the Year is announced in December 2026; this page
              will update when it lands.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
