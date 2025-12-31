import { useEffect, useState } from "react";
import CommandPalette from "./components/CommandPalette";
import NotesList from "./components/NotesList";
import Editor from "./components/Editor";

import useCommandPalette from "./hooks/useCommandPalette";
import useUndo from "./hooks/useUndo";
import { ToastProvider, useToast } from "./context/ToastContext";

/* ---------------- 내부 App ---------------- */

function AppInner() {
  const { open, closePalette } = useCommandPalette();
  const { showToast } = useToast();
  const { capture, undo } = useUndo();

  const [notes, setNotes] = useState([]);
  const [currentNoteId, setCurrentNoteId] = useState(null);

  /* ---------------- 초기 데이터 (임시) ---------------- */
  useEffect(() => {
    const initial = [
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
    setNotes(initial);
    setCurrentNoteId(initial[0].id);
  }, []);

  const currentNote = notes.find((n) => n.id === currentNoteId);

  /* ---------------- 명령 처리 ---------------- */

  const handleCommand = (commandId) => {
    if (commandId === "note.new") {
      capture(notes);

      const newNote = {
        id: Date.now().toString(),
        title: "새 노트",
        content: "",
      };

      setNotes((prev) => [newNote, ...prev]);
      setCurrentNoteId(newNote.id);

      showToast({ message: "새 노트가 생성되었습니다" });
    }

    if (commandId === "note.delete") {
      if (!currentNoteId) return;

      capture(notes);

      setNotes((prev) => prev.filter((n) => n.id !== currentNoteId));
      setCurrentNoteId(null);

      showToast({
        message: "노트가 삭제되었습니다",
        actionLabel: "Undo",
        onAction: () => {
          const prev = undo();
          if (prev) {
            setNotes(prev);
            setCurrentNoteId(currentNoteId);
          }
        },
      });
    }

    if (commandId === "file.export") {
      showToast({ message: "노트 내보내기 (미구현)" });
    }
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
      <Editor
        note={currentNote}
        onChange={(content) =>
          setNotes((prev) =>
            prev.map((n) => (n.id === currentNoteId ? { ...n, content } : n))
          )
        }
      />

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

/* ---------------- App Root ---------------- */

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
