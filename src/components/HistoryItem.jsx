function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 1000 * 60) return "방금 전";
  if (diff < 1000 * 60 * 60) return `${Math.floor(diff / 60000)}분 전`;
  return `${Math.floor(diff / 3600000)}시간 전`;
}

export function HistoryItem({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderBottom: "1px solid #eee",
        cursor: "pointer",
      }}
    >
      <div style={{ fontSize: 13 }}>{item.label}</div>

      <div
        style={{
          fontSize: 11,
          color: "#666",
          marginTop: 4,
        }}
      >
        {timeAgo(item.timestamp)}
      </div>
    </div>
  );
}
