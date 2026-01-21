import { useRef } from "react";
import { canMerge } from "../utils/historyMerge";

export default function useUndoRedo(limit = 100) {
  const undoStack = useRef([]);
  const redoStack = useRef([]);

  const push = (action) => {
    const last = undoStack.current.at(-1);

    if (canMerge(last, action)) {
      // 🔥 merge: prevState는 유지, nextState만 갱신
      undoStack.current[undoStack.current.length - 1] = {
        ...last,
        nextState: action.nextState,
        timestamp: action.timestamp,
      };
      return;
    }

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
  const jumpTo = (targetIndex, apply) => {
    const total = undoStack.current.length;
    if (targetIndex < 0 || targetIndex >= total) return;

    const stepsToUndo = total - 1 - targetIndex;

    for (let i = 0; i < stepsToUndo; i++) {
      const action = undoStack.current.pop();
      redoStack.current.push(action);
      apply(action.prevState);
    }
  };
  return {
    push,
    undo,
    redo,
    jumpTo,
    canUndo: () => undoStack.current.length > 0,
    canRedo: () => redoStack.current.length > 0,
  };
}
