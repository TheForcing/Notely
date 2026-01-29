import React, { useEffect, useMemo, useRef } from "react";
import useSharedSearch from "../hooks/useSharedSearch";
import useKeyboardNavigation from "../hooks/useKeyboardNavigation";
import { buildSnippet, highlight } from "../utils/snippet";

export default function NotesList({
  notes,
  query,
  activeId,
  onSelect,
  onCloseSearch,
  fuzzy = true,
  threshold = 0.4,
}) {
  const options = useMemo(
    () => ({
      includeScore: true,
      threshold: fuzzy ? threshold : 0,
      ignoreLocation: true,
      keys: [
        { name: "title", weight: 0.7 },
        { name: "tags", weight: 0.2 },
        { name: "body", weight: 0.1 },
      ],
    }),
    [fuzzy, threshold]
  );

  const { search, results, ready } = useSharedSearch(notes, options);
  const list = query ? results : notes;

  const { activeIndex, setActiveIndex } = useKeyboardNavigation(
    list.length,
    (index) => {
      const note = list[index];
      if (note) onSelect(note.id);
    },
    () => onCloseSearch?.()
  );

  // 🔹 검색 실행
  useEffect(() => {
    if (query && ready) search(query);
  }, [query, ready, search]);

  // 🔹 검색어 변경 시 포커스 초기화
  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  // 🔹 자동 스크롤 핵심
  const itemRefs = useRef([]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const el = itemRefs.current[activeIndex];
    if (!el) return;

    el.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeIndex]);

  return (
    <ul
      role="listbox"
      style={{
        width: 280,
        padding: 12,
        overflowY: "auto",
        maxHeight: "100%",
      }}
    >
      {!ready && query && (
        <li style={{ fontSize: 12, color: "#6b7280" }}>검색 인덱스 준비 중…</li>
      )}

      {list.map((note, index) => {
        const isActive = index === activeIndex;
        const snippet = query
          ? buildSnippet(note.body || "", query)
          : (note.body || "").slice(0, 80);

        return (
          <li
            key={note.id}
            ref={(el) => (itemRefs.current[index] = el)}
            role="option"
            aria-selected={isActive}
            className={`note-item ${isActive ? "active" : ""}`}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => onSelect(note.id)}
            style={{
              padding: 10,
              marginBottom: 6,
              borderRadius: 8,
              cursor: "pointer",
              background: isActive ? "#eef2ff" : "#fff",
            }}
          >
            <div style={{ fontWeight: 700 }}>
              {query ? highlight(note.title, query) : note.title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#6b7280",
                marginTop: 4,
              }}
            >
              {query ? highlight(snippet, query) : snippet}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
