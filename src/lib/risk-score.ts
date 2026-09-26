export function computeRiskScore(
  elaVarianceScore: number | null,
  ocrConfidenceScore: number,
  checksumValid: boolean | null,
  layoutConsistencyScore: number
): number {
  const w1 = 0.30;
  const w2 = 0.25;
  const w3 = 0.25;
  const w4 = 0.20;

  const elaTerm = elaVarianceScore === null ? 50 : elaVarianceScore;
  const checksumTerm = checksumValid === false ? 100 : checksumValid === true ? 0 : 50;

  let score = w1 * elaTerm + w2 * (100 - ocrConfidenceScore) + w3 * checksumTerm + w4 * (100 - layoutConsistencyScore);

  score = Math.round(score);

  if (checksumValid === false) {
    score = Math.max(75, score);
  }

  return Math.max(1, Math.min(100, score));
}
