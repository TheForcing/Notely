import React, { useEffect } from "react";
import useSearchWorker from "../hooks/useSearchWorker";

export default function NotesList({
  notes,
  query,
  onSelect,
  activeId,
  fuzzy = true,
  threshold = 0.4,
}) {
  const options = {
    includeScore: true,
    threshold,
    ignoreLocation: true,
    keys: [
      { name: "title", weight: 0.7 },
      { name: "tags", weight: 0.2 },
      { name: "body", weight: 0.1 },
    ],
  };

  const { search, results, ready } = useSearchWorker(notes, options);

  useEffect(() => {
    if (query && ready) {
      search(query);
    }
  }, [query, ready]);

  const list = query ? results : notes;

  return (
    <div style={{ width: 280, padding: 12 }}>
      {!ready && query && (
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          검색 인덱스 생성 중…
        </div>
      )}

      {list.map((n) => (
        <div
          key={n.id}
          onClick={() => onSelect(n.id)}
          style={{
            padding: 8,
            marginBottom: 6,
            borderRadius: 6,
            background: n.id === activeId ? "#eef2ff" : "#fff",
            cursor: "pointer",
          }}
        >
          <strong>{n.title}</strong>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {(n.body || "").slice(0, 80)}
          </div>
        </div>
      ))}
    </div>
  );
}
