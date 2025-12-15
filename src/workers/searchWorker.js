/// <reference lib="webworker" />
import Fuse from "fuse.js";

let fuse = null;
let lastNotesHash = "";

function hashNotes(notes) {
  return notes.map((n) => n.id + (n.updatedAt || "")).join("|");
}

self.onmessage = (e) => {
  const { type, payload } = e.data;

  if (type === "INIT") {
    const { notes, options } = payload;
    const hash = hashNotes(notes);

    if (!fuse || hash !== lastNotesHash) {
      fuse = new Fuse(notes, options);
      lastNotesHash = hash;
    }

    self.postMessage({ type: "READY" });
  }

  if (type === "SEARCH") {
    if (!fuse) return;

    const { query, limit = 200, requestId } = payload;

    const results = fuse.search(query, { limit }).map((r) => r.item);

    self.postMessage({
      type: "RESULT",
      payload: {
        requestId,
        results,
      },
    });
  }
};
