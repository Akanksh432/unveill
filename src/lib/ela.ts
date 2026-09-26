export async function runELA(imageFile: File): Promise<{
  heatmapDataUrl: string;
  varianceScore: number;
  binaryMask: Uint8Array;
  width: number;
  height: number;
  rawDiffs: Float32Array;
  adaptiveThreshold: number;
} | null> {
  if (imageFile.type !== "image/jpeg" && imageFile.type !== "image/jpg") {
    return null;
  }

  const loadImg = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const getCanvasContext = (img: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Could not get 2d context");
    ctx.drawImage(img, 0, 0);
    return { canvas, ctx, imageData: ctx.getImageData(0, 0, img.width, img.height) };
  };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const originalSrc = e.target?.result as string;
        const originalImg = await loadImg(originalSrc);

        const { canvas: originalCanvas, imageData: originalData } = getCanvasContext(originalImg);

        const reencodedSrc = originalCanvas.toDataURL("image/jpeg", 0.9);
        const reencodedImg = await loadImg(reencodedSrc);

        const { ctx: heatmapCtx, imageData: reencodedData } = getCanvasContext(reencodedImg);

        const width = originalImg.width;
        const height = originalImg.height;
        const heatmapData = new ImageData(width, height);

        const AMPLIFY = 10;
        const pixelCount = originalData.data.length / 4;
        const diffs = new Float32Array(pixelCount);
        let sum = 0;

        for (let i = 0; i < pixelCount; i++) {
          const idx = i * 4;
          const rDiff = Math.abs(originalData.data[idx] - reencodedData.data[idx]);
          const gDiff = Math.abs(originalData.data[idx + 1] - reencodedData.data[idx + 1]);
          const bDiff = Math.abs(originalData.data[idx + 2] - reencodedData.data[idx + 2]);

          const maxDiff = Math.max(rDiff, gDiff, bDiff);
          const amplified = maxDiff * AMPLIFY;
          diffs[i] = amplified;
          sum += amplified;
        }

        const mean = sum / pixelCount;
        let varianceSum = 0;
        for (let i = 0; i < pixelCount; i++) {
          const diff = diffs[i] - mean;
          varianceSum += diff * diff;
        }
        const stdDev = Math.sqrt(varianceSum / pixelCount);

        // Adaptive statistical threshold (mean + 2.5 * stdDev)
        const adaptiveThreshold = mean + 2.5 * stdDev;
        const ceiling = Math.max(255, adaptiveThreshold * 3);

        let hotspotPixels = 0;
        const binaryMask = new Uint8Array(pixelCount);

        for (let i = 0; i < pixelCount; i++) {
          const amplified = diffs[i];
          if (amplified >= adaptiveThreshold) {
            hotspotPixels++;
            binaryMask[i] = 1;
          }

          // 5-stage thermal gradient: deep blue -> cyan -> green -> yellow -> red
          const intensity = Math.min(1, amplified / ceiling);
          let r = 0, g = 0, b = 0;

          if (intensity < 0.25) {
             const t = intensity / 0.25;
             r = 0;
             g = Math.floor(t * 255);
             b = Math.floor(128 + t * 127);
          } else if (intensity < 0.5) {
             const t = (intensity - 0.25) / 0.25;
             r = 0;
             g = 255;
             b = Math.floor(255 - t * 255);
          } else if (intensity < 0.75) {
             const t = (intensity - 0.5) / 0.25;
             r = Math.floor(t * 255);
             g = 255;
             b = 0;
          } else {
             const t = (intensity - 0.75) / 0.25;
             r = 255;
             g = Math.floor(255 - t * 255);
             b = 0;
          }

          const idx = i * 4;
          heatmapData.data[idx] = r;
          heatmapData.data[idx + 1] = g;
          heatmapData.data[idx + 2] = b;
          heatmapData.data[idx + 3] = 255;
        }

        heatmapCtx.putImageData(heatmapData, 0, 0);

        // varianceScore = % of the image that is a genuine hotspot, scaled
        // up (most real tamper patches only cover a small fraction of the
        // frame, so raw % would always look tiny otherwise), then capped.
        const hotspotRatio = hotspotPixels / pixelCount; // 0-1
        const varianceScore = Math.min(100, hotspotRatio * 100 * 6);

        resolve({
          heatmapDataUrl: heatmapCtx.canvas.toDataURL("image/jpeg", 0.8),
          varianceScore,
          binaryMask,
          width,
          height,
          rawDiffs: diffs,
          adaptiveThreshold
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
}

export function recomputeBoxes(
  diffs: Float32Array, width: number, height: number, threshold: number
): { x: number; y: number; width: number; height: number }[] {
  const pixelCount = width * height;
  const binaryMask = new Uint8Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    if (diffs[i] >= threshold) {
      binaryMask[i] = 1;
    }
  }
  const closedMask = applyMorphologicalClosing(binaryMask, width, height);
  return extractBoundingBoxes(closedMask, width, height);
}

export function applyMorphologicalClosing(
  binaryMask: Uint8Array, width: number, height: number, kernelSize: number = 3
): Uint8Array {
  const half = Math.floor(kernelSize / 2);
  const dilated = new Uint8Array(width * height);
  const closed = new Uint8Array(width * height);

  // Dilation
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (binaryMask[y * width + x] === 1) {
        for (let dy = -half; dy <= half; dy++) {
          for (let dx = -half; dx <= half; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              dilated[ny * width + nx] = 1;
            }
          }
        }
      }
    }
  }

  // Erosion
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let keep = 1;
      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            if (dilated[ny * width + nx] === 0) {
              keep = 0;
            }
          }
        }
      }
      closed[y * width + x] = keep;
    }
  }
  
  return closed;
}

export function extractBoundingBoxes(
  filteredMask: Uint8Array, width: number, height: number, minArea: number = 400
): { x: number; y: number; width: number; height: number }[] {
  const visited = new Uint8Array(width * height);
  const boxes = [];
  const step = 6;
  
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = y * width + x;
      if (filteredMask[idx] === 1 && visited[idx] === 0) {
        // Flood fill
        const stack = [idx];
        visited[idx] = 1;
        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;
        let hitPoints = 0;

        while (stack.length > 0) {
          const curr = stack.pop()!;
          const cy = Math.floor(curr / width);
          const cx = curr % width;
          hitPoints++;

          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          // Check neighbors (up, down, left, right)
          const neighbors = [
            curr - width,
            curr + width,
            curr - 1,
            curr + 1
          ];

          for (let i = 0; i < neighbors.length; i++) {
            const n = neighbors[i];
            if (n >= 0 && n < width * height) {
              // Wrap-around prevention for left/right
              if (cx === 0 && i === 2) continue;
              if (cx === width - 1 && i === 3) continue;

              if (filteredMask[n] === 1 && visited[n] === 0) {
                visited[n] = 1;
                stack.push(n);
              }
            }
          }
        }

        const area = (maxX - minX + 1) * (maxY - minY + 1);
        if (area >= minArea && hitPoints >= 3) {
          boxes.push({
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
          });
        }
      }
    }
  }

  return boxes;
}
