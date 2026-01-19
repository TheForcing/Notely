export default function HistoryPanel({ history = [], onSelect }) {
  return (
    <div
      style={{
        width: 260,
        borderLeft: "1px solid #e5e5e5",
        background: "#fafafa",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid #ddd",
          fontWeight: 600,
        }}
      >
        History
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {history.length === 0 && (
          <div style={{ padding: 12, color: "#888" }}>변경 기록 없음</div>
        )}

        {history.map((item, index) => (
          <HistoryItem
            key={index}
            item={item}
            onClick={() => onSelect?.(item, index)}
          />
        ))}
      </div>
    </div>
  );
}
