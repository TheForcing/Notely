import React, { useRef, useState } from "react";
import SearchInput from "./components/SearchInput";
import NotesList from "./components/NotesList";
import useGlobalSearchShortcut from "./hooks/useGlobalSearchShortcut";

export default function App({ notes }) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef(null);

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  // 🔥 / 키 글로벌 검색
  useGlobalSearchShortcut(openSearch);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: 300, borderRight: "1px solid #e5e7eb" }}>
        {searchOpen && (
          <div style={{ padding: 8 }}>
            <SearchInput
              ref={inputRef}
              value={query}
              onChange={setQuery}
              onClose={closeSearch}
            />
          </div>
        )}

        <NotesList
          notes={notes}
          query={query}
          onCloseSearch={closeSearch}
          onSelect={(id) => {
            console.log("open note", id);
            closeSearch();
          }}
        />
      </div>
    </div>
  );
}
