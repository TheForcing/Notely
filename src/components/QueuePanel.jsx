// src/components/QueuePanel.jsx
import React, { useEffect, useMemo } from "react";

function formatSec(s) {
  if (s == null) return "??:??";
  if (s <= 0) return "0s";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

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
  estimateEtaForPending,
  globalAvgSpeed,
}) {
  useEffect(() => {
    refreshQueue && refreshQueue();
  }, []);

  // compute overall ETA by summing (for items not yet uploaded) remaining bytes divided by expected speed
  const overallEtaSec = useMemo(() => {
    // order by priority desc then createdAt asc (queueFiles should already be sorted)
    const list = queueFiles || [];
    // for each item: if progress exists, use remaining from progress; else use full size
    let totalRemaining = 0;
    list.forEach((f) => {
      const p = queueProgress[f.id];
      if (
        p &&
        typeof p.bytesTransferred === "number" &&
        typeof p.totalBytes === "number"
      ) {
        totalRemaining += Math.max(
          0,
          (p.totalBytes || f.size || 0) - (p.bytesTransferred || 0)
        );
      } else {
        totalRemaining += f.size || 0;
      }
    });
    const speed = globalAvgSpeed || 50; // fallback bytes/sec
    if (speed <= 0) return null;
    return Math.ceil(totalRemaining / speed);
  }, [queueFiles, queueProgress, globalAvgSpeed]);

  const pendingCount = queueFiles.filter((f) => f.status === "pending").length;

  return (
    <aside
      style={{
        width: 360,
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
          maxHeight: 420,
          overflow: "auto",
        }}
      >
        {queueFiles.length === 0 && (
          <div style={{ color: "#6b7280" }}>큐가 비어있습니다.</div>
        )}
        {queueFiles.map((f) => {
          const prog = queueProgress[f.id] || {};
          const eta =
            prog.etaSec != null
              ? prog.etaSec
              : estimateEtaForPending
              ? estimateEtaForPending(f)
              : null;
          const speed = prog.speedBytesPerSec || globalAvgSpeed || 0;
          const speedLabel = speed ? `${Math.round(speed / 1024)} KB/s` : "—";
          return (
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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {formatSec(eta)}
                  </div>
                </div>
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
                      width: `${prog.pct || 0}%`,
                      background: "#2563eb",
                      transition: "width 0.2s",
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                  속도: {speedLabel}
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

      <div
        style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid #eee" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700 }}>전체 예상 소요</div>
          <div style={{ fontSize: 13 }}>
            {overallEtaSec != null
              ? overallEtaSec > 3600
                ? `${Math.round(overallEtaSec / 3600)}h`
                : `${Math.round(overallEtaSec / 60)}m`
              : "알수없음"}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
          평균속도:{" "}
          {globalAvgSpeed ? `${Math.round(globalAvgSpeed / 1024)} KB/s` : "—"}
        </div>
      </div>
    </aside>
  );
}
