import { useState } from "react";

function previewText(text, len = 80) {
  if (!text) return "";
  return text.length > len ? text.slice(0, len) + "…" : text;
}

export default function HistoryItem({ item, onClick }) {
  const [hover, setHover] = useState(false);

  const prevNote = item.prevState?.find((n) => n.id === item.noteId);
  const nextNote = item.nextState?.find((n) => n.id === item.noteId);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        padding: "10px 14px",
        borderBottom: "1px solid #eee",
        cursor: "pointer",
      }}
    >
      <div style={{ fontSize: 13 }}>{item.label}</div>

      <div style={{ fontSize: 11, color: "#666" }}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </div>

      {hover && (
        <div
          style={{
            position: "absolute",
            left: -320,
            top: 0,
            width: 300,
            background: "#fff",
            border: "1px solid #ddd",
            boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
            padding: 10,
            zIndex: 10,
            fontSize: 12,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            {nextNote?.title || "제목 없음"}
          </div>

          {item.type === "content" && (
            <>
              <div style={{ color: "#888" }}>이전</div>
              <div>{previewText(prevNote?.content)}</div>

              <div
                style={{
                  marginTop: 6,
                  color: "#888",
                }}
              >
                이후
              </div>
              <div>{previewText(nextNote?.content)}</div>
            </>
          )}

          {item.type === "title" && (
            <>
              <div style={{ color: "#888" }}>이전 제목</div>
              <div>{prevNote?.title}</div>

              <div
                style={{
                  marginTop: 6,
                  color: "#888",
                }}
              >
                이후 제목
              </div>
              <div>{nextNote?.title}</div>
            </>
          )}

          {item.type === "tag" && (
            <>
              <div style={{ color: "#888" }}>태그 변경</div>
              <div>{(prevNote?.tags || []).join(", ")}</div>
              <div
                style={{
                  marginTop: 6,
                  color: "#888",
                }}
              >
                →
              </div>
              <div>{(nextNote?.tags || []).join(", ")}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
