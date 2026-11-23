/**
 * Peak forecasting.
 *
 * Projects when a trend will peak from its current position on the
 * velocity curve and the typical lifecycle length of its attribute type.
 * Colors and aesthetics run longer than micro-trends on single items;
 * that is why the lifecycle length is per attribute type.
 *
 * Model:
 * - progress is approximated by relative volume (how big the trend
 *   already is vs the biggest trend in the dataset).
 * - weeksToPeak = typical lifecycle weeks x (1 - progress), so a trend
 *   that is still small with strong velocity has further to run.
 * - the peak window is wider for slow-burn types (color, aesthetic)
 *   and narrower for fast ones (item, pattern).
 * - estimatedPeakScore grows with current velocity, capped at 100.
 *
 * Declining and dead trends have already peaked: weeksToPeak is 0.
 */
import type { AttributeType, Forecast, LifecycleStage } from './types';

/** Typical full lifecycle length in weeks, by attribute type. */
export const TYPICAL_LIFECYCLE_WEEKS: Record<AttributeType, number> = {
  color: 10,
  pattern: 8,
  silhouette: 8,
  item: 6,
  fabric: 8,
  aesthetic: 12,
};

export interface ForecastInputs {
  attributeType: AttributeType;
  stage: LifecycleStage;
  /** Latest week-over-week growth rate. */
  velocityRate: number;
  /** Volume relative to the highest-volume trend (0-1). */
  relativeVolume: number;
  /** Current Trend Score (0-100). */
  trendScore: number;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function forecastPeak(input: ForecastInputs): Forecast {
  const { attributeType, stage, velocityRate, relativeVolume, trendScore } = input;

  // Already past the peak: no future window to project.
  if (stage === 'declining' || stage === 'dead') {
    return {
      weeksToPeak: 0,
      peakWindowStartWeeks: 0,
      peakWindowEndWeeks: 0,
      estimatedPeakScore: Math.round(trendScore),
    };
  }

  const typical = TYPICAL_LIFECYCLE_WEEKS[attributeType];
  const remaining = typical * (1 - clamp(relativeVolume, 0, 1));

  // A trend already at peak is ~1 week from its highest point.
  const weeksToPeak =
    stage === 'peak' ? 1 : clamp(Math.round(remaining), 1, 12);

  // Slow-burn types peak over a wider window.
  const windowWidth =
    attributeType === 'color' || attributeType === 'aesthetic' ? 3 : 2;

  const estimatedPeakScore = clamp(
    Math.round(trendScore * (1 + Math.max(0, velocityRate) * 0.25)),
    0,
    100,
  );

  return {
    weeksToPeak,
    peakWindowStartWeeks: weeksToPeak,
    peakWindowEndWeeks: weeksToPeak + windowWidth,
    estimatedPeakScore,
  };
}
