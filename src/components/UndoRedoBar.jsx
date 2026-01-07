export default function UndoRedoBar({ canUndo, canRedo, onUndo, onRedo }) {
  return (
    <div
      style={{
        height: 40,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 12px",
        borderBottom: "1px solid #eee",
        background: "#fafafa",
      }}
    >
      <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl/Cmd + Z)">
        ⟲ Undo
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl/Cmd + Shift + Z)"
      >
        ⟳ Redo
      </button>
    </div>
  );
}
