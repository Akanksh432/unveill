export function computeRiskScore(
  elaVarianceScore: number | null,
  ocrConfidenceScore: number,
  checksumValid: boolean | null
): number {
  const w1 = 0.40;
  const w2 = 0.30;
  const w3 = 0.30;

  const elaTerm = elaVarianceScore === null ? 50 : elaVarianceScore;
  const checksumTerm = checksumValid === false ? 100 : checksumValid === true ? 0 : 50;

  let score = w1 * elaTerm + w2 * (100 - ocrConfidenceScore) + w3 * checksumTerm;

  score = Math.round(score);

  if (checksumValid === false) {
    score = Math.max(75, score);
  }

  return Math.max(1, Math.min(100, score));
}
