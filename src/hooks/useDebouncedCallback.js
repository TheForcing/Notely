import { useRef } from "react";

export default function useDebouncedCallback(callback, delay = 500) {
  const timer = useRef(null);
  const lastArgs = useRef(null);

  const run = (...args) => {
    lastArgs.current = args;

    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => {
      callback(...lastArgs.current);
      timer.current = null;
      lastArgs.current = null;
    }, delay);
  };

  run.flush = () => {
    if (timer.current && lastArgs.current) {
      clearTimeout(timer.current);
      callback(...lastArgs.current);
      timer.current = null;
      lastArgs.current = null;
    }
  };

  run.cancel = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
      lastArgs.current = null;
    }
  };

  return run;
}
