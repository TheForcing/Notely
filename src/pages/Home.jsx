// src/pages/Home.jsx
import React from "react";
import Sidebar from "../components/Sidebar";
import NotesList from "../components/NotesList";
import Editor from "../components/EditorWithIndexedDB";
import QueuePanel from "../components/QueuePanel";
import useNotes from "../hooks/useNotes";

export default function Home() {
  const {
    notes,
    rawNotes,
    createNote,
    updateNote,
    deleteNote,
    addAttachmentMeta,
    enqueueFile,
    activeNoteId,
    setActiveNoteId,
    processFileQueue,
    queueFiles,
    queueProgress,
    refreshQueue,
    retryQueuedFile,
    removeQueuedFile,
  } = useNotes();

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        onCreate={createNote}
        exportNotes={() => JSON.stringify({ notes: rawNotes })}
      />
      <div style={{ flex: 1, display: "flex" }}>
        <NotesList
          notes={notes}
          onSelect={setActiveNoteId}
          onDelete={deleteNote}
          onTogglePin={() => {}}
          activeId={activeNoteId}
        />
        <Editor
          note={rawNotes.find((n) => n.id === activeNoteId)}
          onChange={updateNote}
          onDelete={deleteNote}
          onTogglePin={() => {}}
        />
        <QueuePanel
          queueFiles={queueFiles}
          queueProgress={queueProgress}
          refreshQueue={refreshQueue}
          retryQueuedFile={retryQueuedFile}
          removeQueuedFile={removeQueuedFile}
          processFileQueue={processFileQueue}
        />
      </div>
    </div>
  );
}
