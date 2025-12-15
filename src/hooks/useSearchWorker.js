import { useEffect, useRef, useState } from "react";

export default function useSearchWorker(notes, options, delay = 300) {
  const workerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const requestIdRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/searchWorker.js", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;

      if (type === "READY") {
        setReady(true);
      }

      if (type === "RESULT") {
        // ✅ 최신 요청만 반영
        if (payload.requestId === requestIdRef.current) {
          setResults(payload.results);
        }
      }
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
    if (!workerRef.current) return;

    // 이전 디바운스 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      requestIdRef.current += 1;
      const currentId = requestIdRef.current;

      workerRef.current.postMessage({
        type: "SEARCH",
        payload: {
          query,
          requestId: currentId,
        },
      });
    }, delay);
  };

  return { search, results, ready };
}
