import { useRef } from "react";

export default function useUndoRedo(limit = 50) {
  const undoStack = useRef([]);
  const redoStack = useRef([]);

  const push = (state) => {
    undoStack.current.push(structuredClone(state));
    if (undoStack.current.length > limit) {
      undoStack.current.shift();
    }
    redoStack.current = [];
  };

  const undo = (current) => {
    if (undoStack.current.length === 0) return null;
    const prev = undoStack.current.pop();
    redoStack.current.push(structuredClone(current));
    return prev;
  };

  const redo = (current) => {
    if (redoStack.current.length === 0) return null;
    const next = redoStack.current.pop();
    undoStack.current.push(structuredClone(current));
    return next;
  };

  return {
    push,
    undo,
    redo,
    canUndo: () => undoStack.current.length > 0,
    canRedo: () => redoStack.current.length > 0,
  };
}
