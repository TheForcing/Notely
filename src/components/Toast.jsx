export default function Toast({ message, actionLabel, onAction }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        background: "#111827",
        color: "#fff",
        padding: "12px 16px",
        borderRadius: 8,
        display: "flex",
        gap: 12,
        alignItems: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        zIndex: 2000,
      }}
    >
      <span>{message}</span>
      {actionLabel && (
        <button
          onClick={onAction}
          style={{
            background: "transparent",
            border: "none",
            color: "#60a5fa",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
