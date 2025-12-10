// src/components/SearchBar.jsx
import React, { useEffect, useRef } from "react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "검색: 제목/본문/태그",
  clearOnEsc = true,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      // Ctrl/Cmd+K focus
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current && ref.current.focus();
      }
      // Esc clears and blurs
      if (e.key === "Escape" && clearOnEsc) {
        if (value) onChange("");
        ref.current && ref.current.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onChange, value, clearOnEsc]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8 }}>
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: "8px 12px",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          outline: "none",
        }}
      />
      {value ? (
        <button
          onClick={() => onChange("")}
          style={{ padding: "6px 8px", borderRadius: 6 }}
        >
          지우기
        </button>
      ) : null}
    </div>
  );
}
