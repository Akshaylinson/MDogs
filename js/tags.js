import { uid } from "./helpers.js";
import { getAll as getAllRows, put as putRow, del as delRow } from "./db.js";

export async function syncTagsFromMedia() {
  const media = await getAllRows("media");
  const tags = new Map();
  for (const item of media) {
    for (const tag of item.tags || []) {
      tags.set(tag.toLowerCase(), tag);
    }
  }

  const existing = await getAllRows("tags");
  const keep = new Set([...tags.keys()]);
  for (const entry of existing) {
    if (!keep.has(entry.tagName.toLowerCase())) {
      await delRow("tags", entry.id);
    }
  }

  for (const tagName of tags.values()) {
    const normalized = tagName.toLowerCase();
    if (!existing.some((entry) => entry.tagName.toLowerCase() === normalized)) {
      await putRow("tags", { id: uid("tag"), tagName, createdAt: new Date().toISOString() });
    }
  }
}

export async function existingTags() {
  const rows = await getAllRows("tags");
  return rows.map((row) => row.tagName).sort((a, b) => a.localeCompare(b));
}
