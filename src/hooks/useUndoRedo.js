import { useRef } from "react";

const MAX_STACK = 20;

export default function useUndoRedo() {
  const undoStack = useRef([]);
  const redoStack = useRef([]);

  const clone = (state) => JSON.parse(JSON.stringify(state));

  const push = (state) => {
    undoStack.current.unshift(clone(state));
    redoStack.current = []; // 🔥 새 작업 → redo 초기화

    if (undoStack.current.length > MAX_STACK) {
      undoStack.current.pop();
    }
  };

  const undo = (currentState) => {
    if (!undoStack.current.length) return null;

    const prev = undoStack.current.shift();
    redoStack.current.unshift(clone(currentState));
    return prev;
  };

  const redo = (currentState) => {
    if (!redoStack.current.length) return null;

    const next = redoStack.current.shift();
    undoStack.current.unshift(clone(currentState));
    return next;
  };

  const canUndo = () => undoStack.current.length > 0;
  const canRedo = () => redoStack.current.length > 0;

  return {
    push,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
