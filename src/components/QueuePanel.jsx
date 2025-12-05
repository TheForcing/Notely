// src/components/QueuePanel.jsx
import React, { useEffect, useRef, useState } from "react";

export default function QueuePanel({
  queueFiles = [],
  queueProgress = {},
  refreshQueue,
  retryQueuedFile,
  removeQueuedFile,
  processFileQueue,
  moveQueuedFileUp,
  moveQueuedFileDown,
  reorderQueue,
}) {
  const [localOrder, setLocalOrder] = useState(queueFiles.map((f) => f.id));
  const dragSrcIdRef = useRef(null);
  const listRef = useRef(null);

  // when external queueFiles update, sync local order (preserve items that remain)
  useEffect(() => {
    const ids = queueFiles.map((f) => f.id);
    // if localOrder doesn't match new ids (e.g. new item added/removed), rebuild sensible localOrder
    setLocalOrder((prev) => {
      // preserve previous ordering but append new ones & remove missing ones
      const setIds = new Set(ids);
      const preserved = prev.filter((id) => setIds.has(id));
      const appended = ids.filter((id) => !preserved.includes(id));
      return [...preserved, ...appended];
    });
  }, [queueFiles]);

  useEffect(() => {
    refreshQueue && refreshQueue();
  }, []);

  // drag handlers
  const onDragStart = (e, id) => {
    dragSrcIdRef.current = id;
    e.dataTransfer.effectAllowed = "move";
    // for firefox; set some data
    try {
      e.dataTransfer.setData("text/plain", id);
    } catch (err) {}
    e.currentTarget.classList.add("dragging");
  };

  const onDragOver = (e, overId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    // show insertion visually by reordering localOrder
    const srcId = dragSrcIdRef.current;
    if (!srcId || srcId === overId) return;
    setLocalOrder((prev) => {
      const next = prev.slice();
      const srcIndex = next.indexOf(srcId);
      const overIndex = next.indexOf(overId);
      if (srcIndex === -1 || overIndex === -1) return prev;
      // remove src
      next.splice(srcIndex, 1);
      // insert before overIndex (if dragging downward, after removal the index may shift)
      const insertIndex = next.indexOf(overId);
      next.splice(insertIndex, 0, srcId);
      return next;
    });
  };

  const onDragEnd = (e) => {
    e.currentTarget.classList.remove("dragging");
    dragSrcIdRef.current = null;
  };

  const onDrop = async (e) => {
    e.preventDefault();
    const srcId =
      dragSrcIdRef.current ||
      (() => {
        try {
          return e.dataTransfer.getData("text/plain");
        } catch {
          return null;
        }
      })();
    // if no src recorded, fallback to current localOrder
    if (!srcId) {
      // still try to reorder using localOrder
      if (reorderQueue) await reorderQueue(localOrder);
      return;
    }
    // apply reorder: localOrder already updated during dragover; just call reorderQueue
    if (reorderQueue) {
      try {
        await reorderQueue(localOrder);
      } catch (err) {
        console.warn("reorderQueue error", err);
      }
    }
    dragSrcIdRef.current = null;
  };

  const pendingCount = queueFiles.filter((f) => f.status === "pending").length;

  // helper to map id -> file
  const fileById = {};
  for (const f of queueFiles) fileById[f.id] = f;

  return (
    <aside
      style={{
        width: 320,
        borderLeft: "1px solid #e5e7eb",
        padding: 12,
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <h3 style={{ margin: 0 }}>Upload Queue</h3>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          {pendingCount} pending
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button
          onClick={() => processFileQueue && processFileQueue()}
          style={{ padding: "6px 8px", borderRadius: 6 }}
        >
          강제 재시도
        </button>
        <button
          onClick={() => refreshQueue && refreshQueue()}
          style={{ padding: "6px 8px", borderRadius: 6 }}
        >
          새로고침
        </button>
      </div>

      <div
        ref={listRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxHeight: 420,
          overflow: "auto",
        }}
      >
        {localOrder.length === 0 && (
          <div style={{ color: "#6b7280" }}>큐가 비어있습니다.</div>
        )}
        {localOrder.map((id) => {
          const f = fileById[id];
          if (!f) return null;
          return (
            <div
              key={f.id}
              draggable
              onDragStart={(e) => onDragStart(e, f.id)}
              onDragOver={(e) => onDragOver(e, f.id)}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
              style={{
                padding: 8,
                border: "1px solid #eef2ff",
                borderRadius: 6,
                background: "#fafafa",
                display: "flex",
                gap: 8,
                alignItems: "center",
                cursor: "move",
              }}
            >
              <div style={{ width: 28, textAlign: "center", fontWeight: 700 }}>
                ::
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{f.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  노트: {f.noteId} • 상태: {f.status} • 시도: {f.attempts || 0}{" "}
                  • 우선순위: {f.priority || 0}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    height: 8,
                    background: "#e6e6e6",
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${queueProgress[f.id] || 0}%`,
                      background: "#2563eb",
                      transition: "width 0.2s",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button
                  onClick={() => moveQueuedFileUp && moveQueuedFileUp(f.id)}
                  style={{ padding: "6px 8px" }}
                >
                  위로
                </button>
                <button
                  onClick={() => moveQueuedFileDown && moveQueuedFileDown(f.id)}
                  style={{ padding: "6px 8px" }}
                >
                  아래
                </button>
                <button
                  onClick={() => retryQueuedFile && retryQueuedFile(f.id)}
                  style={{ padding: "6px 8px" }}
                >
                  재시도
                </button>
                <button
                  onClick={() => removeQueuedFile && removeQueuedFile(f.id)}
                  style={{
                    padding: "6px 8px",
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
