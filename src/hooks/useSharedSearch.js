import { useEffect, useRef, useState } from "react";

export default function useSharedSearch(notes, options, delay = 300) {
  const workerRef = useRef(null);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!("SharedWorker" in window)) {
      console.warn("SharedWorker not supported");
      return;
    }

    workerRef.current = new SharedWorker(
      new URL("../workers/searchSharedWorker.js", import.meta.url),
      { type: "module" }
    );

    workerRef.current.port.onmessage = (e) => {
      const { type, payload } = e.data;

      if (type === "READY") setReady(true);

      if (type === "RESULT") {
        if (payload.requestId === requestIdRef.current) {
          setResults(payload.results);
        }
      }
    };

    workerRef.current.port.start();

    return () => workerRef.current?.port.close();
  }, []);

  useEffect(() => {
    if (!workerRef.current || !notes.length) return;
    setReady(false);

    workerRef.current.port.postMessage({
      type: "INIT",
      payload: { notes, options },
    });
  }, [notes, options]);

  const search = (query) => {
    if (!workerRef.current) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      requestIdRef.current += 1;

      workerRef.current.port.postMessage({
        type: "SEARCH",
        payload: {
          query,
          requestId: requestIdRef.current,
        },
      });
    }, delay);
  };

  return { search, results, ready };
}
