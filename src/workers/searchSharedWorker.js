/// <reference lib="webworker" />
import Fuse from "fuse.js";

let fuse = null;
let lastHash = "";

function hashNotes(notes) {
  return notes.map((n) => n.id + (n.updatedAt || "")).join("|");
}

const ports = new Set();

self.onconnect = (e) => {
  const port = e.ports[0];
  ports.add(port);

  port.onmessage = (event) => {
    const { type, payload } = event.data;

    if (type === "INIT") {
      const { notes, options } = payload;
      const hash = hashNotes(notes);

      if (!fuse || hash !== lastHash) {
        fuse = new Fuse(notes, options);
        lastHash = hash;
      }

      port.postMessage({ type: "READY" });
    }

    if (type === "SEARCH") {
      if (!fuse) return;

      const { query, requestId, limit = 200 } = payload;
      const results = fuse.search(query, { limit }).map((r) => r.item);

      port.postMessage({
        type: "RESULT",
        payload: { requestId, results },
      });
    }
  };

  port.start();
};
