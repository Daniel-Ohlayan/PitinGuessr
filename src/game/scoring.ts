export const MAX_ROUND_SCORE = 5000;
/** Радиус «идеального» попадания, м. */
const PERFECT_RADIUS = 25;

/**
 * Формула в духе GeoGuessr: 5000 · e^(-10 · d / D),
 * где d — ошибка в метрах, D — размер карты (диагональ bbox города в метрах).
 */
export function calculateScore(distanceMeters: number, mapSizeMeters: number): number {
  if (distanceMeters <= PERFECT_RADIUS) return MAX_ROUND_SCORE;
  const score = MAX_ROUND_SCORE * Math.exp((-10 * distanceMeters) / mapSizeMeters);
  return Math.max(0, Math.min(MAX_ROUND_SCORE, Math.round(score)));
}
