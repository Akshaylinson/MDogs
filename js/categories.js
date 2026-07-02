import { getAll, put, del, getById } from "./db.js";
import { uid, slugify } from "./helpers.js";
import { notify } from "./notifications.js";

async function uniqueSlug(name, ignoreId = null) {
  const base = slugify(name) || "category";
  const categories = await getAll("categories");
  const taken = new Set(categories.filter((category) => category.id !== ignoreId).map((category) => category.slug));
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export async function listCategories() {
  return getAll("categories");
}

export async function createCategory(name, thumbnailBlob = null) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const now = new Date().toISOString();
  const category = {
    id: uid("cat"),
    name: trimmed,
    slug: await uniqueSlug(trimmed),
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
  for (const item of media.filter((entry) => entry.categoryId === id)) {
    await del("media", item.id);
  }
  await del("categories", id);
  notify("Category deleted");
}
