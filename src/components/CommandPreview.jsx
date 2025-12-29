export default function CommandPreview({ item }) {
  if (!item) {
    return (
      <div style={{ padding: 16, color: "#9ca3af" }}>선택한 항목 미리보기</div>
    );
  }

  if (item.title) {
    return (
      <div style={{ padding: 16 }}>
        <h3>{item.title}</h3>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          {item.content?.slice(0, 120) || "내용 없음"}
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h3>⌘ {item.label}</h3>
      <p style={{ color: "#6b7280", marginTop: 8 }}>
        {item.category} 관련 명령
      </p>
    </div>
  );
}
