import React from "react";

export default function CompressionControls({
  enabled,
  setEnabled,
  quality,
  setQuality,
  maxDim,
  setMaxDim,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        이미지 압축
      </label>

      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        품질
        <input
          type="range"
          min={0.4}
          max={1}
          step={0.05}
          value={quality}
          onChange={(e) => setQuality(parseFloat(e.target.value))}
        />
        {Math.round(quality * 100)}%
      </label>

      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        최대 길이(px)
        <input
          type="number"
          value={maxDim}
          onChange={(e) => setMaxDim(parseInt(e.target.value || 0))}
          style={{ width: 100 }}
        />
      </label>
    </div>
  );
}
