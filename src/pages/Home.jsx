// src/pages/Home.jsx
import React, { useState } from "react";
import Editor from "../components/EditorWithIndexedDB";
import useNotes from "../hooks/useNotes";
import NotesList from "../components/NotesList";
import SearchBar from "../components/SearchBar";

export default function Home() {
  const {
    notes,
    rawNotes,
    createNote,
    updateNote,
    deleteNote,
    activeNoteId,
    setActiveNoteId,
  } = useNotes();
  const [query, setQuery] = useState("");
  const [fuzzy, setFuzzy] = useState(true);
  const [threshold, setThreshold] = useState(0.4);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div
        style={{
          width: 320,
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <h2 style={{ margin: 0 }}>Notely</h2>
            <button onClick={createNote}>New</button>
          </div>
          <SearchBar
            value={query}
            onChange={setQuery}
            fuzzy={fuzzy}
            onToggleFuzzy={setFuzzy}
            threshold={threshold}
            onChangeThreshold={setThreshold}
          />
        </div>
        <NotesList
          notes={notes}
          onSelect={setActiveNoteId}
          onDelete={deleteNote}
          activeId={activeNoteId}
          query={query}
          fuzzy={fuzzy}
          threshold={threshold}
        />
      </div>

      <div style={{ flex: 1 }}>
        <Editor
          note={rawNotes.find((n) => n.id === activeNoteId)}
          onChange={updateNote}
          onDelete={deleteNote}
          onTogglePin={() => {}}
        />
      </div>
    </div>
  );
}
