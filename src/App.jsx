import { useMemo, useState } from "react";
import NotesList from "./components/NotesList";
import Editor from "./components/Editor";
import UndoRedoBar from "./components/UndoRedoBar";
import CommandPalette from "./components/CommandPalette";
import Toast from "./components/Toast";

import useUndoRedo from "./hooks/useUndoRedo";
import useDebouncedCallback from "./hooks/useDebouncedCallback";

import { contentChange, titleChange, tagChange } from "./utils/historyActions";

export default function App() {
  const [notes, setNotes] = useState([]);
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const undoRedo = useUndoRedo();

  /* ----------------------------------
     Toast
  ---------------------------------- */
  const showToast = ({ message }) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  /* ----------------------------------
     Debounced undo push (content only)
  ---------------------------------- */
  const debouncedPushUndo = useDebouncedCallback((action) => {
    undoRedo.push(action);
  }, 600);

  /* ----------------------------------
     Derived
  ---------------------------------- */
  const currentNote = useMemo(
    () => notes.find((n) => n.id === currentNoteId),
    [notes, currentNoteId],
  );

  /* ----------------------------------
     Note selection
  ---------------------------------- */
  const handleSelectNote = (id) => {
    // 타이핑 중이면 undo 강제 커밋
    debouncedPushUndo.flush();
    setCurrentNoteId(id);
  };

  /* ----------------------------------
     Content change (debounced undo)
  ---------------------------------- */
  const handleChangeContent = (noteId, nextContent) => {
    setNotes((prev) => {
      const next = prev.map((n) =>
        n.id === noteId ? { ...n, content: nextContent } : n,
      );

      debouncedPushUndo(contentChange(noteId, prev, next));

      return next;
    });
  };

  /* ----------------------------------
     Title change (immediate undo)
  ---------------------------------- */
  const handleChangeTitle = (noteId, nextTitle) => {
    setNotes((prev) => {
      const next = prev.map((n) =>
        n.id === noteId ? { ...n, title: nextTitle } : n,
      );

      undoRedo.push(titleChange(noteId, prev, next));

      return next;
    });
  };

  /* ----------------------------------
     Tag change (immediate undo)
  ---------------------------------- */
  const handleChangeTags = (noteId, nextTags) => {
    setNotes((prev) => {
      const next = prev.map((n) =>
        n.id === noteId ? { ...n, tags: nextTags } : n,
      );

      undoRedo.push(tagChange(noteId, prev, next));

      return next;
    });
  };

  /* ----------------------------------
     Apply state for undo / redo
  ---------------------------------- */
  const applyNotes = (next) => {
    setNotes(next);
  };

  const handleUndo = () => {
    debouncedPushUndo.flush();
    const action = undoRedo.undo(applyNotes);
    if (action) {
      showToast({ message: `Undo: ${action.label}` });
    }
  };

  const handleRedo = () => {
    const action = undoRedo.redo(applyNotes);
    if (action) {
      showToast({ message: `Redo: ${action.label}` });
    }
  };
  const handleJumpHistory = (index) => {
    // 타이핑 중이면 먼저 커밋
    debouncedPushUndo.flush();

    undoRedo.jumpTo(index, applyNotes);

    showToast({
      message: `히스토리 이동`,
    });
  };

  /* ----------------------------------
     Render
  ---------------------------------- */
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <NotesList
        notes={notes}
        currentNoteId={currentNoteId}
        onSelect={handleSelectNote}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <UndoRedoBar
          canUndo={undoRedo.canUndo()}
          canRedo={undoRedo.canRedo()}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />

        {currentNote ? (
          <Editor
            note={currentNote}
            onChangeContent={handleChangeContent}
            onChangeTitle={handleChangeTitle}
            onChangeTags={handleChangeTags}
            onBlur={() => debouncedPushUndo.flush()}
          />
        ) : (
          <div style={{ padding: 24, color: "#888" }}>노트를 선택하세요</div>
        )}
      </div>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}

      {toast && <Toast message={toast} />}
      <HistoryPanel
        history={undoRedo.getHistory()}
        onSelect={(item, index) => handleJumpHistory(index)}
      />
    </div>
  );
}
