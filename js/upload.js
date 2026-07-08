import { uid, isImageFile, isVideoFile } from "./helpers.js";
import { put as putRow } from "./db.js";
import { notify } from "./notifications.js";
import { syncTagsFromMedia } from "./tags.js";

const imageMime = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);
const videoMime = new Set(["video/mp4", "video/webm"]);

export function validateFile(file) {
  return imageMime.has(file.type) || videoMime.has(file.type);
}

async function makeImageThumbnail(file) {
  const dataUrl = await blobToDataURL(file);
  const img = new Image();
  img.src = dataUrl;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const maxSize = 480;
  const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.82);
  });
}

async function makeThumbnail(file) {
  if (isImageFile(file)) {
    return makeImageThumbnail(file);
  }
  return null;
}

export async function addMediaFiles(categoryId, files, onProgress = () => {}) {
  const accepted = [...files].filter(validateFile);
  const total = accepted.length || 1;
  const created = [];

  for (let i = 0; i < accepted.length; i += 1) {
    const file = accepted[i];
    const thumbnailBlob = await makeThumbnail(file);
    const now = new Date().toISOString();
    const media = {
      id: uid("media"),
      categoryId,
      fileName: file.name,
      mediaType: isImageFile(file) ? "image" : "video",
      mimeType: file.type,
      blobData: file,
      thumbnailBlob,
      fileSize: file.size,
      width: null,
      height: null,
      duration: null,
      tags: [],
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };
    await putRow("media", media);
    created.push(media);
    onProgress(Math.round(((i + 1) / total) * 100), file.name);
  }

  if (created.length) {
    await syncTagsFromMedia();
    notify(`${created.length} file(s) uploaded`);
  }
  return created;
}

export function createUploadQueue(files) {
  return [...files].filter(validateFile).map((file) => ({
    id: uid("queue"),
    file,
    name: file.name,
    size: file.size,
    type: file.type,
  }));
}
