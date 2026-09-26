export function checkAlignmentConsistency(
  lines: { words: { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }[] }[]
): { alignmentScore: number; anomalies: { type: string; description: string }[] } {
  const anomalies: { type: string; description: string }[] = [];

  for (const line of lines) {
    if (!line.words || line.words.length <= 2) continue;

    let totalHeight = 0;
    const heights = line.words.map(w => w.bbox.y1 - w.bbox.y0);
    for (const h of heights) {
      totalHeight += h;
    }
    const avgHeight = totalHeight / heights.length;

    for (let i = 0; i < line.words.length; i++) {
      const h = heights[i];
      const deviation = Math.abs(h - avgHeight) / avgHeight;
      if (deviation > 0.8) {
        anomalies.push({
          type: "FONT_SCALE_DISCREPANCY",
          description: `Word '${line.words[i].text}' height (${Math.round(h)}px) deviates significantly from line average (${Math.round(avgHeight)}px).`
        });
      }
    }
  }

  const penalty = anomalies.length * 10;
  const alignmentScore = Math.max(0, 100 - penalty);

  return { alignmentScore, anomalies };
}
