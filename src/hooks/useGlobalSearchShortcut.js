import { useEffect } from "react";

export default function useGlobalSearchShortcut(openSearch) {
  useEffect(() => {
    const handler = (e) => {
      // 이미 input/textarea에 포커스가 있으면 무시
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "/") {
        e.preventDefault();
        openSearch();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openSearch]);
}
