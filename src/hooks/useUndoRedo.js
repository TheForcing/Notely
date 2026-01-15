import { useRef } from "react";

export default function useUndoRedo(limit = 100) {
  const undoStack = useRef([]);
  const redoStack = useRef([]);

  const push = (action) => {
    undoStack.current.push(action);
    if (undoStack.current.length > limit) {
      undoStack.current.shift();
    }
    redoStack.current = [];
  };

  const undo = (apply) => {
    if (undoStack.current.length === 0) return;
    const action = undoStack.current.pop();
    redoStack.current.push(action);
    apply(action.prevState);
    return action;
  };

  const redo = (apply) => {
    if (redoStack.current.length === 0) return;
    const action = redoStack.current.pop();
    undoStack.current.push(action);
    apply(action.nextState);
    return action;
  };

  return {
    push,
    undo,
    redo,
    canUndo: () => undoStack.current.length > 0,
    canRedo: () => redoStack.current.length > 0,
  };
}
