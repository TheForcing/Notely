export function normalizeTag(tag = "") {
  return tag.replace(/^#/, "").trim().toLowerCase();
}

export function parseTagFilter(tagFilter = "") {
  return tagFilter
    .split(/[\s,]+/)
    .map(normalizeTag)
    .filter(Boolean);
}

export function matchesTagFilter(note, tagFilter = "") {
  const tokens = Array.isArray(tagFilter)
    ? tagFilter.map(normalizeTag).filter(Boolean)
    : parseTagFilter(tagFilter);
  if (tokens.length === 0) return true;

  const noteTags = (note.tags || []).map(normalizeTag).filter(Boolean);
  if (noteTags.length === 0) return false;

  const tagSet = new Set(noteTags);
  return tokens.every((t) => tagSet.has(t));
}

export function matchesTextFilter(note, query = "") {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const title = (note.title || "").toLowerCase();
  const body = (note.body || "").toLowerCase();
  const tags = (note.tags || []).map((t) => t.toLowerCase());

  return title.includes(q) || body.includes(q) || tags.some((t) => t.includes(q));
}
