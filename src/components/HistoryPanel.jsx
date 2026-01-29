import HistoryItem from "./HistoryItem";

export default function HistoryPanel({ history, cursor, onSelect }) {
  const groupedHistory = useMemo(() => {
    const map = {};

    filteredHistory.forEach((item) => {
      if (!map[item.noteId]) {
        map[item.noteId] = {
          noteId: item.noteId,
          noteTitle: item.noteTitle,
          items: [],
        };
      }
      map[item.noteId].items.push(item);
    });

    // 최신 변경이 위로 오도록
    Object.values(map).forEach((group) => {
      group.items.sort((a, b) => b.timestamp - a.timestamp);
    });

    return Object.values(map).sort(
      (a, b) => b.items[0].timestamp - a.items[0].timestamp,
    );
  }, [filteredHistory]);
  return (
    <div style={{ width: 260 }}>
      <div style={{ padding: 12, fontWeight: 600 }}>History</div>

      {history.map((item, index) => (
        <HistoryItem
          key={index}
          item={item}
          onClick={() => onSelect(item, index)}
        />
      ))}
    </div>
  );
}
