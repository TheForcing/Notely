import React, { useMemo, useState } from "react";
import Sidebar from "../components/SidebarWithSettings";
import NotesList from "../components/NotesList";
import Editor from "../components/EditorWithAttachments";
import useNotes from "../hooks/useNotes";
import { matchesTagFilter } from "../utils/noteFilters";

export default function Home() {
  const {
    notes,
    rawNotes,
    createNote,
    updateNote,
    deleteNote,
    activeNoteId,
    setActiveNoteId,
    exportNotes,
    importNotes,
    togglePin,
    uploadAttachment,
    removeAttachment,
  } = useNotes();

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const filteredNotes = useMemo(
    () => notes.filter((note) => matchesTagFilter(note, tagFilter)),
    [notes, tagFilter]
  );

  return (
    <div className="flex h-screen">
      <Sidebar
        onCreate={createNote}
        search={search}
        setSearch={setSearch}
        tagFilter={tagFilter}
        setTagFilter={setTagFilter}
        exportNotes={exportNotes}
        importNotes={importNotes}
      />
      <div className="flex-1 flex">
        <NotesList
          notes={filteredNotes}
          query={search}
          onSelect={setActiveNoteId}
          onDelete={deleteNote}
          onTogglePin={togglePin}
          activeId={activeNoteId}
        />
        <Editor
          note={rawNotes.find((n) => n.id === activeNoteId)}
          onChange={updateNote}
          onDelete={deleteNote}
          onTogglePin={togglePin}
          uploadAttachment={uploadAttachment}
          removeAttachment={removeAttachment}
        />
      </div>
    </div>
  );
}
