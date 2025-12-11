// src/components/SearchBar.jsx
import React, { useEffect, useRef } from "react";

export default function SearchBar({
  value,
  onChange,
  fuzzy = true,
  onToggleFuzzy,
  threshold = 0.4,
  onChangeThreshold,
  placeholder = "검색: 제목/본문/태그",
  clearOnEsc = true,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current && ref.current.focus();
      }
      if (e.key === "Escape" && clearOnEsc) {
        if (value) onChange("");
        ref.current && ref.current.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onChange, value, clearOnEsc]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: 8,
        flexWrap: "wrap",
      }}
    >
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
          minWidth: 160,
        }}
      />

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            fontSize: 12,
          }}
        >
          <input
            type="checkbox"
            checked={fuzzy}
            onChange={(e) => onToggleFuzzy && onToggleFuzzy(e.target.checked)}
          />
          Fuzzy
        </label>

        <label
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            fontSize: 12,
          }}
        >
          민감도
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={threshold}
            onChange={(e) =>
              onChangeThreshold && onChangeThreshold(parseFloat(e.target.value))
            }
            style={{ width: 120 }}
          />
          {threshold}
        </label>

        {value ? (
          <button
            onClick={() => onChange("")}
            style={{ padding: "6px 8px", borderRadius: 6 }}
          >
            지우기
          </button>
        ) : null}
      </div>
    </div>
  );
}
