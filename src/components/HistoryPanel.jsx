export default function HistoryPanel({ history = [], cursor, onSelect }) {
  return (
    <div style={{ width: 260, borderLeft: "1px solid #e5e5e5" }}>
      <div style={{ padding: 12, fontWeight: 600 }}>History</div>

      {history.map((item, index) => {
        const isCurrent = index === 0;
        const isRedo = index > cursor;

        return (
          <div
            key={index}
            onClick={() => onSelect?.(item, index)}
            style={{
              padding: "10px 14px",
              cursor: "pointer",
              background: isCurrent
                ? "#e6f0ff"
                : isRedo
                  ? "#f5f5f5"
                  : "transparent",
              opacity: isRedo ? 0.5 : 1,
              borderBottom: "1px solid #eee",
            }}
          >
            <div style={{ fontSize: 13 }}>{item.label}</div>

            <div style={{ fontSize: 11, color: "#666" }}>
              {new Date(item.timestamp).toLocaleTimeString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
