// src/utils/imageCompress.js
// file: File -> Promise<Blob>
// options: { maxWidth, maxHeight, quality } quality: 0..1
export async function compressImageFile(file, options = {}) {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.8 } = options;
  if (!file || !file.type.startsWith("image/")) return file;

  // load image
  const img = await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => {
      URL.revokeObjectURL(url);
      resolve(i);
    };
    i.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지 로드 실패"));
    };
    i.src = url;
  });

  let { width, height } = img;
  const ratio = Math.min(1, maxWidth / width, maxHeight / height);
  const targetW = Math.round(width * ratio);
  const targetH = Math.round(height * ratio);

  // if no resizing needed and user requests quality 1, return original file
  if (ratio === 1 && quality >= 0.98) return file;

  // draw to canvas
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  // draw with smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // convert to blob (jpeg if original not webp/png? keep same mime if possible)
  const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, mime, quality)
  );

  // create new File (preserve original name but indicate compressed)
  try {
    const newFile = new File([blob], file.name, {
      type: blob.type,
      lastModified: Date.now(),
    });
    return newFile;
  } catch (e) {
    // fallback to blob if File constructor not supported
    return blob;
  }
}
