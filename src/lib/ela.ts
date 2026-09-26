export async function runELA(imageFile: File): Promise<{
  heatmapDataUrl: string;
  varianceScore: number;
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
        const HOTSPOT_FLOOR = 60;
        let hotspotCount = 0;
        let pixelCount = 0;

        for (let i = 0; i < originalData.data.length; i += 4) {
          const rDiff = Math.abs(originalData.data[i] - reencodedData.data[i]);
          const gDiff = Math.abs(originalData.data[i + 1] - reencodedData.data[i + 1]);
          const bDiff = Math.abs(originalData.data[i + 2] - reencodedData.data[i + 2]);
          
          const maxDiff = Math.max(rDiff, gDiff, bDiff);
          const amplified = Math.min(255, maxDiff * AMPLIFY);
          
          if (amplified > HOTSPOT_FLOOR) {
            hotspotCount++;
          }
          pixelCount++;

          // Heatmap: dark blue/black to red/yellow
          // Low -> dark blue (0, 0, amplified)
          // High -> red/yellow (amplified, amplified/2, 0)
          heatmapData.data[i] = amplified; // R
          heatmapData.data[i + 1] = Math.max(0, amplified - 128) * 2; // G
          heatmapData.data[i + 2] = 255 - amplified; // B
          heatmapData.data[i + 3] = 255; // A
        }

        heatmapCtx.putImageData(heatmapData, 0, 0);
        
        const fraction = hotspotCount / pixelCount;
        const varianceScore = Math.min(100, Math.round(fraction * 100 * 6));

        resolve({
          heatmapDataUrl: heatmapCtx.canvas.toDataURL("image/jpeg", 0.8),
          varianceScore
        });

      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
}
