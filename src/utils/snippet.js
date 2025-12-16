export function buildSnippet(text = "", query = "", radius = 40) {
  if (!text || !query) return "";

  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);

  if (idx === -1) return text.slice(0, radius * 2) + "…";

  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + q.length + radius);

  let snippet = text.slice(start, end);

  if (start > 0) snippet = "…" + snippet;
  if (end < text.length) snippet = snippet + "…";

  return snippet;
}

export function highlight(text = "", query = "") {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped})`, "ig");
  return text.split(re).map((part, i) =>
    re.test(part) ? (
      <mark key={i} style={{ background: "#fde68a" }}>
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
