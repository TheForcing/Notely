import React, { useRef, useState } from "react";
import NotesList from "./components/NotesList";
import CommandPalette from "./components/CommandPalette";
import SearchInput from "./components/SearchInput";

import useCommandPalette from "./hooks/useCommandPalette";
import useGlobalSearchShortcut from "./hooks/useGlobalSearchShortcut";

export default function App() {
  /* ---------------- 상태 ---------------- */
  const [notes, setNotes] = useState([
    { id: "1", title: "첫 번째 노트", body: "리액트 메모 앱" },
    { id: "2", title: "검색 기능", body: "Fuse.js + Worker" },
  ]);

  const [activeNoteId, setActiveNoteId] = useState(null);

  // 일반 검색 (/)
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef(null);

  // Cmd + K 팔레트
  const { open: paletteOpen, closePalette, openPalette } = useCommandPalette();

  /* ---------------- / 글로벌 검색 ---------------- */
  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  useGlobalSearchShortcut(openSearch);

  /* ---------------- 명령 처리 ---------------- */
  const handleCommand = (command) => {
    // 🔥 1번 기능 핵심
    if (command === "new") {
      const id = Date.now().toString();
      const note = {
        id,
        title: "새 노트",
        body: "",
      };
      setNotes((prev) => [note, ...prev]);
      setActiveNoteId(id);
      return;
    }

    if (command === "delete" && activeNoteId) {
      setNotes((prev) => prev.filter((n) => n.id !== activeNoteId));
      setActiveNoteId(null);
      return;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* ---------- Sidebar ---------- */}
      <aside
        style={{
          width: 300,
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* / 검색 입력 */}
        {searchOpen && (
          <div style={{ padding: 8 }}>
            <SearchInput
              ref={searchInputRef}
              value={query}
              onChange={setQuery}
              onClose={closeSearch}
            />
          </div>
        )}

        <NotesList
          notes={notes}
          query={query}
          activeId={activeNoteId}
          onSelect={(id) => {
            setActiveNoteId(id);
            closeSearch();
          }}
          onCloseSearch={closeSearch}
        />
      </aside>

      {/* ---------- Editor ---------- */}
      <main style={{ flex: 1, padding: 24 }}>
        {activeNoteId ? (
          <div>
            <h2>{notes.find((n) => n.id === activeNoteId)?.title}</h2>
            <p>에디터 영역 (생략)</p>
          </div>
        ) : (
          <div style={{ color: "#6b7280" }}>노트를 선택하세요</div>
        )}
      </main>

      {/* ---------- Cmd + K ---------- */}
      {paletteOpen && (
        <CommandPalette
          notes={notes}
          onSelectNote={(id) => {
            setActiveNoteId(id);
            closePalette();
          }}
          onCommand={(cmd) => {
            handleCommand(cmd);
            closePalette();
          }}
          onClose={closePalette}
        />
      )}
    </div>
  );
}
