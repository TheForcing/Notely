// src/components/NotesList.jsx
import React, { useMemo } from "react";

// 간단한 하이라이트: case-insensitive substring -> <mark>
function highlightText(text = "", q = "") {
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(escaped, "ig");
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (start > lastIndex)
      parts.push({ text: text.slice(lastIndex, start), mark: false });
    parts.push({ text: text.slice(start, end), mark: true });
    lastIndex = end;
  }
  if (lastIndex < text.length)
    parts.push({ text: text.slice(lastIndex), mark: false });
  // render as React fragments
  return parts.map((p, i) =>
    p.mark ? (
      <mark key={i} style={{ background: "#fff59d" }}>
        {p.text}
      </mark>
    ) : (
      <span key={i}>{p.text}</span>
    )
  );
}

export default function NotesList({
  notes = [],
  onSelect,
  onDelete,
  activeId,
  query = "",
}) {
  // scoring: simple boost for title match, then body, then tags; substring count as score
  const filtered = useMemo(() => {
    if (!query) return notes;
    const q = query.trim().toLowerCase();
    return notes
      .map((n) => {
        const title = (n.title || "").toLowerCase();
        const body = (n.body || "").toLowerCase();
        const tags = (n.tags || []).map((t) => t.toLowerCase());
        let score = 0;
        if (title.includes(q)) score += 100 + (title.split(q).length - 1);
        if (body.includes(q)) score += 10 + (body.split(q).length - 1);
        if (tags.some((t) => t.includes(q))) score += 30;
        return { note: n, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.note);
  }, [notes, query]);

  const listToRender = query ? filtered : notes;

  return (
    <div
      style={{
        width: 280,
        borderRight: "1px solid #e5e7eb",
        padding: 12,
        overflow: "auto",
      }}
    >
      {listToRender.length === 0 && (
        <div style={{ color: "#6b7280" }}>노트가 없습니다.</div>
      )}
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {listToRender.map((n) => (
          <li
            key={n.id}
            style={{
              padding: 8,
              borderRadius: 8,
              background: n.id === activeId ? "#eef2ff" : "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <button
                onClick={() => onSelect && onSelect(n.id)}
                style={{
                  textAlign: "left",
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}
                >
                  {/* highlight title */}
                  {typeof n.title === "string"
                    ? highlightText(n.title, query)
                    : n.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginTop: 4,
                    maxHeight: 36,
                    overflow: "hidden",
                  }}
                >
                  {/* preview: highlight first 120 chars of body */}
                  {typeof n.body === "string"
                    ? highlightText((n.body || "").slice(0, 240), query)
                    : ""}
                </div>
              </button>
              <div
                style={{
                  marginLeft: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <button
                  onClick={() => onDelete && onDelete(n.id)}
                  style={{
                    padding: "4px 6px",
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(n.tags || []).map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 11,
                    padding: "2px 6px",
                    background: "#f1f5f9",
                    borderRadius: 999,
                  }}
                >
                  {query ? highlightText(t, query) : t}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
