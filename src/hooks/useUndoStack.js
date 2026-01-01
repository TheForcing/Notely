import { useRef } from "react";

const MAX_STACK = 20;

export default function useUndoStack() {
  const stackRef = useRef([]);

  const push = (state) => {
    const snapshot = JSON.parse(JSON.stringify(state));
    stackRef.current.unshift(snapshot);

    if (stackRef.current.length > MAX_STACK) {
      stackRef.current.pop();
    }
  };

  const pop = () => {
    return stackRef.current.shift() || null;
  };

  const canUndo = () => stackRef.current.length > 0;

  return {
    push,
    pop,
    canUndo,
  };
}
