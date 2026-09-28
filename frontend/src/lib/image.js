// Resizes/compresses an image in the browser before upload, so admins can
// pick a photo straight off a phone (5-10MB) without hitting the 1.4MB
// storage limit. Returns a data URL (WebP, or JPEG where WebP isn't supported).
const MAX_BASE64 = 1_800_000;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image'));
    };
    img.src = url;
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export async function prepareImage(file, maxSize = 1600) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file');
  // Animated GIFs would lose their animation on a canvas - keep small ones as-is.
  if (file.type === 'image/gif' && file.size < 1_200_000) return fileToDataUrl(file);

  const img = await loadImage(file);
  let size = maxSize;
  let quality = 0.85;
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, size / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    let dataUrl = canvas.toDataURL('image/webp', quality);
    if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length < MAX_BASE64) return dataUrl;
    size = Math.round(size * 0.8);
    quality = Math.max(0.6, quality - 0.07);
  }
  throw new Error('Image is too large even after compression - try a smaller one');
}
