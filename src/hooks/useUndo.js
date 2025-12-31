import { useRef } from "react";

export default function useUndo() {
  const snapshotRef = useRef(null);

  const capture = (state) => {
    snapshotRef.current = JSON.parse(JSON.stringify(state));
  };

  const undo = () => {
    return snapshotRef.current;
  };

  return { capture, undo };
}
