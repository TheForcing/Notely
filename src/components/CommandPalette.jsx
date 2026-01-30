import React, { useEffect, useRef, useState } from "react";
import { COMMANDS } from "../commands/commands";
import useRecentItems from "../hooks/useRecentItems";
import NotesList from "./NotesList";
import CommandPreview from "./CommandPreview";
import { matchesTextFilter } from "../utils/noteFilters";

export default function CommandPalette({
  notes,
  onSelectNote,
  onCommand,
  onClose,
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const { recentItems, addRecentItem } = useRecentItems();

  const isCommand = query.startsWith(">");
  const showRecent = query.trim() === "";
  const keyword = query.replace(">", "").trim().toLowerCase();
  /* ---------------- 명령 목록 ---------------- */
  const commandItems = COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(keyword)
  );

  const noteItems = notes.filter((n) => matchesTextFilter(n, query));

  /* ---------------- 노트 목록 ---------------- */

  const items = showRecent ? recentItems : isCommand ? commandItems : noteItems;

  /* ---------------- 포커스 ---------------- */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* 🔥 리스트 변경 시 인덱스 초기화 */
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  /* ---------------- 키보드 처리 ---------------- */
  const onKeyDown = (e) => {
    if (e.key === "Escape") return onClose();
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i === 0 ? items.length - 1 : i - 1));
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const item = items[activeIndex];

      if (item.type === "note" || item.title) {
        onSelectNote(item.id);
        addRecentItem({ ...item, type: "note" });
      } else {
        onCommand(item.id);
        addRecentItem({ ...item, type: "command" });
      }
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          margin: "10vh auto",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="> 명령 또는 노트 검색"
          style={{
            width: "100%",
            padding: 14,
            fontSize: 16,
            border: "none",
            outline: "none",
            borderBottom: "1px solid #e5e7eb",
          }}
        />

        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          {isCommand ? (
            <ul>
              {commandItems.map((cmd, i) => (
                <li
                  key={cmd.id}
                  style={{
                    padding: 12,
                    cursor: "pointer",
                    background: i === activeIndex ? "#eef2ff" : "transparent",
                  }}
                >
                  ⌘ {cmd.label}
                </li>
              ))}
            </ul>
          ) : (
            <NotesList
              notes={noteItems}
              query={query}
              activeIndex={activeIndex}
              onSelect={(id) => {
                onSelectNote(id);
                onClose();
              }}
              onHoverIndex={setActiveIndex}
            />
          )}
        </div>
        <div
          style={{
            borderLeft: "1px solid #e5e7eb",
            background: "#f9fafb",
          }}
        >
          <CommandPreview item={items[activeIndex]} />
        </div>
      </div>
    </div>
  );
}
