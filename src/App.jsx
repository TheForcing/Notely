import { useEffect, useState } from "react";

import NotesList from "./components/NotesList";
import Editor from "./components/Editor";
import CommandPalette from "./components/CommandPalette";

import useCommandPalette from "./hooks/useCommandPalette";
import useUndoRedo from "./hooks/useUndoRedo";
import useGlobalUndoRedo from "./hooks/useGlobalUndoRedo";

import { ToastProvider, useToast } from "./context/ToastContext";

/* ============================================================
   내부 App (비즈니스 로직)
============================================================ */

function AppInner() {
  const { open, closePalette } = useCommandPalette();
  const { showToast } = useToast();

  const undoRedo = useUndoRedo();

  const [notes, setNotes] = useState([]);
  const [currentNoteId, setCurrentNoteId] = useState(null);

  /* ---------------- 초기 데이터 ---------------- */

  useEffect(() => {
    const initialNotes = [
      {
        id: "1",
        title: "Notely 구조",
        content: "노트 앱 전체 구조 정리",
      },
      {
        id: "2",
        title: "Firebase API",
        content: "Auth / Firestore / Storage 메모",
      },
    ];

    setNotes(initialNotes);
    setCurrentNoteId(initialNotes[0].id);
  }, []);

  const currentNote = notes.find((n) => n.id === currentNoteId);

  /* ---------------- 전역 Undo / Redo ---------------- */

  useGlobalUndoRedo({
    onUndo: () => {
      const prev = undoRedo.undo(notes);
      if (prev) {
        setNotes(prev);
        showToast({ message: "Undo 실행됨" });
      }
    },
    onRedo: () => {
      const next = undoRedo.redo(notes);
      if (next) {
        setNotes(next);
        showToast({ message: "Redo 실행됨" });
      }
    },
  });

  /* ---------------- 명령 처리 ---------------- */

  const handleCommand = (commandId) => {
    /* 새 노트 */
    if (commandId === "note.new") {
      undoRedo.push(notes);

      const newNote = {
        id: Date.now().toString(),
        title: "새 노트",
        content: "",
      };

      setNotes((prev) => [newNote, ...prev]);
      setCurrentNoteId(newNote.id);

      showToast({ message: "새 노트가 생성되었습니다" });
    }

    /* 노트 삭제 */
    if (commandId === "note.delete") {
      if (!currentNoteId) return;

      undoRedo.push(notes);

      setNotes((prev) => prev.filter((n) => n.id !== currentNoteId));
      setCurrentNoteId(null);

      showToast({
        message: "노트가 삭제되었습니다",
        actionLabel: "Undo",
        onAction: () => {
          const prev = undoRedo.undo(notes);
          if (prev) setNotes(prev);
        },
      });
    }

    /* Undo / Redo 명령 */
    if (commandId === "edit.undo") {
      const prev = undoRedo.undo(notes);
      if (prev) {
        setNotes(prev);
        showToast({ message: "Undo 실행됨" });
      }
    }

    if (commandId === "edit.redo") {
      const next = undoRedo.redo(notes);
      if (next) {
        setNotes(next);
        showToast({ message: "Redo 실행됨" });
      }
    }
  };

  /* ---------------- 노트 편집 ---------------- */
  /* ⚠️ 잦은 입력은 push하지 않음 (blur / debounce 권장) */

  const handleChangeContent = (content) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === currentNoteId ? { ...n, content } : n))
    );
  };

  /* ---------------- 렌더 ---------------- */

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* 사이드바 */}
      <NotesList
        notes={notes}
        activeId={currentNoteId}
        onSelect={setCurrentNoteId}
      />

      {/* 에디터 */}
      <Editor note={currentNote} onChange={handleChangeContent} />

      {/* Command Palette */}
      {open && (
        <CommandPalette
          notes={notes}
          onSelectNote={setCurrentNoteId}
          onCommand={handleCommand}
          onClose={closePalette}
        />
      )}
    </div>
  );
}

/* ============================================================
   App Root
============================================================ */

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
