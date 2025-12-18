import React, { useEffect } from "react";
import useSharedSearch from "../hooks/useSharedSearch";
import useKeyboardNavigation from "../hooks/useKeyboardNavigation";
import { buildSnippet, highlight } from "../utils/snippet";

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
  const { search, results, ready } = useSharedSearch(notes, options);
  const { activeIndex, setActiveIndex } = useKeyboardNavigation(
    results.length,
    (index) => openNote(results[index].id),
    () => closeSearch()
  );
  useEffect(() => {
    if (query && ready) search(query);
  }, [query, ready]);

  const list = query ? results : notes;

  return (
    <div style={{ width: 280, padding: 12 }}>
      {!ready && query && (
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          검색 인덱스 준비 중…
        </div>
      )}

      {list.map((n) => {
        const snippet = query
          ? buildSnippet(n.body || "", query)
          : (n.body || "").slice(0, 80);

        return (
          <div
            key={n.id}
            onClick={() => onSelect(n.id)}
            style={{
              padding: 10,
              marginBottom: 8,
              borderRadius: 8,
              background: n.id === activeId ? "#eef2ff" : "#fff",
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 700 }}>
              {query ? highlight(n.title, query) : n.title}
            </div>

            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              {query ? highlight(snippet, query) : snippet}
            </div>
          </div>
        );
      })}
    </div>
  );
}
