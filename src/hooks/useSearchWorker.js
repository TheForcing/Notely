import { useEffect, useRef, useState } from "react";

export default function useSearchWorker(notes, options) {
  const workerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/searchWorker.js", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === "READY") setReady(true);
      if (type === "RESULT") setResults(payload);
    };

    return () => workerRef.current?.terminate();
  }, []);

  useEffect(() => {
    if (!workerRef.current || !notes.length) return;

    setReady(false);
    workerRef.current.postMessage({
      type: "INIT",
      payload: { notes, options },
    });
  }, [notes, options]);

  const search = (query) => {
    if (!ready || !workerRef.current) return;
    workerRef.current.postMessage({
      type: "SEARCH",
      payload: { query },
    });
  };

  return { search, results, ready };
}
