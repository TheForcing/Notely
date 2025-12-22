import React, { useEffect, useRef, useState } from "react";
import NotesList from "./NotesList";

export default function CommandPalette({ notes, onSelectNote, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
          placeholder="명령 또는 노트 검색…"
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
          <NotesList
            notes={notes}
            query={query}
            onSelect={(id) => {
              onSelectNote(id);
              onClose();
            }}
            onCloseSearch={onClose}
          />
        </div>
      </div>
    </div>
  );
}
