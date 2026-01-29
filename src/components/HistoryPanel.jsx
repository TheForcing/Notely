import HistoryItem from "./HistoryItem";

export default function HistoryPanel({ history, onSelect }) {
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
