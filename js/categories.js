import { getAll, put, del, bulkDel, getById, getFirstByIndex } from "./db.js";
import { uid, slugify } from "./helpers.js";
import { notify } from "./notifications.js";

// Use the slug index instead of a full table scan
async function uniqueSlug(name, ignoreId = null) {
  const base = slugify(name) || "category";
  let candidate = base;
  let suffix = 1;
  while (true) {
    const existing = await getFirstByIndex("categories", "slug", candidate);
    if (!existing || existing.id === ignoreId) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

// Compress a thumbnail File/Blob to a small JPEG blob before storing
async function compressThumbnail(file) {
  if (!file) return null;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 240; // small enough to be fast, big enough to look good
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.75);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

export async function listCategories() {
  return getAll("categories");
}

export async function createCategory(name, thumbnailFile = null) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  // Run slug lookup and thumbnail compression in parallel
  const [slug, thumbnailBlob] = await Promise.all([
    uniqueSlug(trimmed),
    compressThumbnail(thumbnailFile),
  ]);

  const now = new Date().toISOString();
  const category = {
    id: uid("cat"),
    name: trimmed,
    slug,
    coverMediaId: null,
    thumbnailBlob: thumbnailBlob || null,
    createdAt: now,
    updatedAt: now,
  };
  await put("categories", category);
  notify("Category created");
  return category;
}

export async function renameCategory(id, name) {
  const category = await getById("categories", id);
  if (!category) return null;
  const trimmed = name.trim();
  if (!trimmed) return category;
  category.name = trimmed;
  category.slug = await uniqueSlug(trimmed, id);
  category.updatedAt = new Date().toISOString();
  await put("categories", category);
  notify("Category renamed");
  return category;
}

export async function deleteCategory(id) {
  const media = await getAll("media");
  const ids = media.filter((m) => m.categoryId === id).map((m) => m.id);
  // Delete all media in one transaction, then delete the category
  await Promise.all([
    bulkDel("media", ids),
    del("categories", id),
  ]);
  notify("Category deleted");
}
