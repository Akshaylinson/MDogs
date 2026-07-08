import { uid } from "./helpers.js";
import { getAll as getAllRows, bulkPut, bulkDel } from "./db.js";

export async function syncTagsFromMedia() {
  const [media, existing] = await Promise.all([
    getAllRows("media"),
    getAllRows("tags"),
  ]);

  // Collect all unique tags from media
  const tagMap = new Map();
  for (const item of media) {
    for (const tag of item.tags || []) {
      tagMap.set(tag.toLowerCase(), tag);
    }
  }

  // Find rows to delete (tags no longer used)
  const toDelete = existing
    .filter((e) => !tagMap.has(e.tagName.toLowerCase()))
    .map((e) => e.id);

  // Find tags to add (not yet in the tags store)
  const existingNorm = new Set(existing.map((e) => e.tagName.toLowerCase()));
  const now = new Date().toISOString();
  const toAdd = [...tagMap.values()]
    .filter((t) => !existingNorm.has(t.toLowerCase()))
    .map((tagName) => ({ id: uid("tag"), tagName, createdAt: now }));

  await Promise.all([
    bulkDel("tags", toDelete),
    bulkPut("tags", toAdd),
  ]);
}

export async function existingTags() {
  const rows = await getAllRows("tags");
  return rows.map((r) => r.tagName).sort((a, b) => a.localeCompare(b));
}
