/**
 * Lifecycle classification.
 *
 * A trend's stage is read off the shape of its velocity curve and its
 * breadth (how many source categories are observing it), not from any
 * single week's volume:
 *
 * - emerging:   low volume, high velocity, low breadth. Seen on a few
 *                sources, growing fast, not yet mainstream.
 * - rising:     volume and breadth both growing. The default for a trend
 *                with positive velocity that is not (yet) peaking.
 * - peak:       high volume, velocity flattening toward zero. Everyone
 *                is talking about it and growth has stalled.
 * - declining:  negative velocity. Mentions are falling week over week.
 * - dead:       very low volume AND still falling. The conversation
 *                has moved on.
 */
import type { LifecycleStage } from './types';

export interface StageInputs {
  /** Volume relative to the highest-volume trend in the dataset (0-1). */
  relativeVolume: number;
  /** Latest week-over-week growth rate, e.g. 0.35 = +35%. */
  velocityRate: number;
  /** Number of distinct source categories observing the trend. */
  breadthCount: number;
}

export function classifyStage(input: StageInputs): LifecycleStage {
  const { relativeVolume, velocityRate, breadthCount } = input;

  if (relativeVolume <= 0.12 && velocityRate <= -0.2) {
    return 'dead';
  }
  if (velocityRate <= -0.15) {
    return 'declining';
  }
  if (relativeVolume < 0.35 && velocityRate > 0.25 && breadthCount <= 5) {
    return 'emerging';
  }
  if (relativeVolume >= 0.6 && Math.abs(velocityRate) <= 0.15) {
    return 'peak';
  }
  return 'rising';
}

/** Human-readable label for a lifecycle stage. */
export const STAGE_LABELS: Record<LifecycleStage, string> = {
  emerging: 'Emerging',
  rising: 'Rising',
  peak: 'Peak',
  declining: 'Declining',
  dead: 'Dead',
};

/** Tailwind classes for the stage badge. */
export const STAGE_STYLES: Record<LifecycleStage, string> = {
  emerging: 'bg-amber-100 text-amber-800 ring-amber-300',
  rising: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  peak: 'bg-rose-100 text-rose-800 ring-rose-300',
  declining: 'bg-slate-200 text-slate-700 ring-slate-300',
  dead: 'bg-zinc-200 text-zinc-500 ring-zinc-300',
};
