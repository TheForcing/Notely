import React, { useEffect, useState, useRef } from "react";
import { marked } from "marked";
import TagInput from "./TagInput";

export default function Editor({ note, onChange, onDelete }) {
  const [draft, setDraft] = useState(note || { title: "", body: "", tags: [] });
  const [status, setStatus] = useState("idle"); // 'idle' | 'saving' | 'saved' | 'nosave'
  const saveTimer = useRef(null);
  const savedAt = useRef(null);

  useEffect(() => {
    setDraft(note || { title: "", body: "", tags: [] });
    setStatus("idle");
  }, [note]);

  // debounce autosave (700ms)
  useEffect(() => {
    if (!note) return;
    setStatus("nosave");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      // only call onChange if something actually changed
      if (
        note.title !== draft.title ||
        note.body !== draft.body ||
        JSON.stringify(note.tags || []) !== JSON.stringify(draft.tags || [])
      ) {
        try {
          setStatus("saving");
          await onChange(note.id, {
            title: draft.title,
            body: draft.body,
            tags: draft.tags,
          });
          savedAt.current = Date.now();
          setStatus("saved");
          // after 1.2s return to idle
          setTimeout(() => setStatus("idle"), 1200);
        } catch (e) {
          console.error("save failed", e);
          setStatus("nosave");
        }
      } else {
        setStatus("idle");
      }
    }, 700);

    return () => clearTimeout(saveTimer.current);
  }, [draft, note, onChange]);

  if (!note)
    return (
      <div className="flex-1 p-6">
        노트를 선택하거나 새 노트를 만들어주세요.
      </div>
    );

  return (
    <div className="flex-1 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3 gap-4">
        <input
          className="text-2xl font-semibold p-2 border rounded w-full"
          value={draft.title}
          onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))}
          placeholder="제목"
        />
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2 items-center">
            <div className="text-xs text-gray-500">
              {status === "saving" && "저장 중…"}
              {status === "saved" && "저장됨"}
              {status === "nosave" && "변경 없음"}
              {status === "idle" && savedAt.current
                ? `마지막 저장: ${new Date(
                    savedAt.current
                  ).toLocaleTimeString()}`
                : ""}
            </div>
            <button
              className="text-sm text-red-600"
              onClick={() => onDelete(note.id)}
            >
              삭제
            </button>
          </div>
          <div className="text-xs text-gray-400">
            {note.updatedAt
              ? `업데이트: ${new Date(note.updatedAt).toLocaleString()}`
              : ""}
          </div>
        </div>
      </div>

      <div className="mb-3">
        <TagInput
          tags={draft.tags || []}
          onChange={(newTags) => setDraft((s) => ({ ...s, tags: newTags }))}
        />
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4">
        <textarea
          value={draft.body}
          onChange={(e) => setDraft((s) => ({ ...s, body: e.target.value }))}
          className="w-full h-full p-3 border rounded resize-none"
        />
        <div className="prose overflow-auto p-3 border rounded">
          <div
            dangerouslySetInnerHTML={{ __html: marked.parse(draft.body || "") }}
          />
        </div>
      </div>
    </div>
  );
}
