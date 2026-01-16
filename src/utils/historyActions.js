export function contentChange(noteId, prevNotes, nextNotes) {
  return {
    type: "content",
    noteId,
    prevState: prevNotes,
    nextState: nextNotes,
    timestamp: Date.now(),
    label: "본문 수정",
  };
}

export function titleChange(noteId, prevNotes, nextNotes) {
  return {
    type: "title",
    noteId,
    prevState: prevNotes,
    nextState: nextNotes,
    timestamp: Date.now(),
    label: "제목 수정",
  };
}

export function tagChange(noteId, prevNotes, nextNotes) {
  return {
    type: "tag",
    noteId,
    prevState: prevNotes,
    nextState: nextNotes,
    timestamp: Date.now(),
    label: "태그 변경",
  };
}
