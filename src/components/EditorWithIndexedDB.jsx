// src/components/EditorWithIndexedDB.jsx
import React, { useEffect, useState, useRef } from "react";
import { marked } from "marked";
import TagInput from "./TagInput";
import useAuth from "../hooks/useAuth";
import useNotes from "../hooks/useNotes";
import { startUploadUserFile } from "../firebase";

export default function Editor({ note, onChange, onDelete, onTogglePin }) {
  const { user } = useAuth();
  const { enqueueFile, addAttachmentMeta } = useNotes();
  const [draft, setDraft] = useState(
    note || { title: "", body: "", tags: [], attachments: [] }
  );
  const [status, setStatus] = useState("idle");
  const saveTimer = useRef(null);

  useEffect(
    () => setDraft(note || { title: "", body: "", tags: [], attachments: [] }),
    [note]
  );

  useEffect(() => {
    if (!note) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
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
          setStatus("saved");
          setTimeout(() => setStatus("idle"), 1000);
        } catch (e) {
          console.error(e);
          setStatus("nosave");
        }
      } else setStatus("idle");
    }, 700);
    return () => clearTimeout(saveTimer.current);
  }, [draft, note, onChange]);

    };


  if (!note)
    return (
      <div className="editor">노트를 선택하거나 새 노트를 만들어주세요.</div>
    );

  return (
    <div className="editor">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <input
          className="text-2xl font-semibold p-2 border rounded"
          value={draft.title}
          onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))}
          placeholder="제목"
        />
        <div style={{ display: "flex", gap: 8 }}>
          <input id="file-input" type="file" onChange={onFile} />
          <button onClick={() => onTogglePin(note.id)}>
            {note.pinned ? "Unpin" : "Pin"}
          </button>
          <button
            onClick={() => onDelete(note.id)}
            style={{ color: "#ef4444" }}
          >
            삭제
          </button>
        </div>
      </div>

      <div className="textarea">
        <textarea
          className="textarea"
          value={draft.body}
          onChange={(e) => setDraft((s) => ({ ...s, body: e.target.value }))}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <TagInput
          tags={draft.tags || []}
          onChange={(newTags) => setDraft((s) => ({ ...s, tags: newTags }))}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700 }}>Attachments</h4>
        <ul>
          {(draft.attachments || []).map((a) => (
            <li key={a.path || a.id}>
              {a.name || a.name} {a.pending ? "(대기중)" : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
