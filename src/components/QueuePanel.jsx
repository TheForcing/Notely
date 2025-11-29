// src/components/QueuePanel.jsx
import React, { useEffect } from "react";

export default function QueuePanel({
  queueFiles = [],
  queueProgress = {},
  refreshQueue,
  retryQueuedFile,
  removeQueuedFile,
  processFileQueue,
}) {
  useEffect(() => {
    // refresh once on mount
    refreshQueue && refreshQueue();
  }, []);

  const pendingCount = queueFiles.filter((f) => f.status === "pending").length;
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
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxHeight: 400,
          overflow: "auto",
        }}
      >
        {queueFiles.length === 0 && (
          <div style={{ color: "#6b7280" }}>큐가 비어있습니다.</div>
        )}
        {queueFiles.map((f) => (
          <div
            key={f.id}
            style={{
              padding: 8,
              border: "1px solid #eef2ff",
              borderRadius: 6,
              background: "#fafafa",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{f.name}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                노트: {f.noteId} • 상태: {f.status} • 시도: {f.attempts || 0}
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
        ))}
      </div>
    </aside>
  );
}
