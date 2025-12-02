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
  const saveTimer = useRef(null);

  // compression settings (local state in editor)
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [quality, setQuality] = useState(0.8);
  const [maxDim, setMaxDim] = useState(1600);

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
          await onChange(note.id, {
            title: draft.title,
            body: draft.body,
            tags: draft.tags,
          });
        } catch (e) {
          console.error(e);
        }
      }
    }, 700);
    return () => clearTimeout(saveTimer.current);
  }, [draft, note, onChange]);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!note) return alert("노트를 먼저 선택하세요");

    // compress if enabled and image
    let toUse = f;
    if (compressionEnabled && f.type && f.type.startsWith("image/")) {
      try {
        const compressed = await compressImageFile(f, {
          maxWidth: maxDim,
          maxHeight: maxDim,
          quality,
        });
        toUse = compressed;
        console.log(
          "이미지 압축: 원본",
          f.size,
          "바이트 → 압축",
          toUse.size || toUse.length || 0,
          "바이트"
        );
      } catch (err) {
        console.warn("이미지 압축 실패, 원본 사용", err);
      }
    }

    // ONLINE: upload immediately, OFFLINE: enqueue to IndexedDB
    if (navigator.onLine && user) {
      try {
        const { finished } = startUploadUserFile(
          user.uid,
          note.id,
          toUse,
          (p) => console.log("progress", p)
        );
        const meta = await finished;
        setDraft((s) => ({
          ...s,
          body: s.body + `\n![](${meta.url})\n`,
          attachments: [...(s.attachments || []), meta],
        }));
        await addAttachmentMeta(note.id, meta);
      } catch (e) {
        alert("업로드 실패: " + (e.message || e));
      }
    } else {
      try {
        const id = await enqueueFile(note.id, toUse);
        alert(
          "오프라인이라 파일을 저장했습니다. 온라인 복귀 시 자동 업로드됩니다. (id: " +
            id +
            ")"
        );
      } catch (e) {
        alert("파일 큐 저장 실패: " + e.message);
      }
    }
    e.target.value = "";
  };

  if (!note)
    return (
      <div className="editor">노트를 선택하거나 새 노트를 만들어주세요.</div>
    );

  return (
    <div style={{ padding: 16 }}>
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

      <div style={{ marginBottom: 12 }}>
        <CompressionControls
          enabled={compressionEnabled}
          setEnabled={setCompressionEnabled}
          quality={quality}
          setQuality={setQuality}
          maxDim={maxDim}
          setMaxDim={setMaxDim}
        />
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
