export const MERGE_WINDOW_MS = 2000;

export function canMerge(prev, next) {
  if (!prev || !next) return false;

  return (
    prev.type === next.type &&
    prev.noteId === next.noteId &&
    next.timestamp - prev.timestamp < MERGE_WINDOW_MS
  );
}
