import { useEffect } from "react";

export default function useGlobalUndoRedo({ onUndo, onRedo }) {
  useEffect(() => {
    const handler = (e) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const cmd = isMac ? e.metaKey : e.ctrlKey;

      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (cmd && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        onRedo();
        return;
      }

      if (cmd && e.key.toLowerCase() === "z") {
        e.preventDefault();
        onUndo();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onUndo, onRedo]);
}
