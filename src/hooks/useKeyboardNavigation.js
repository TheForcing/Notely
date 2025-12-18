import { useEffect, useState } from "react";

export default function useKeyboardNavigation(length, onEnter, onEscape) {
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const handler = (e) => {
      if (!length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % length);
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + length) % length);
      }

      if (e.key === "Enter") {
        if (activeIndex >= 0) onEnter(activeIndex);
      }

      if (e.key === "Escape") {
        onEscape?.();
        setActiveIndex(-1);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [length, activeIndex, onEnter, onEscape]);

  return { activeIndex, setActiveIndex };
}
