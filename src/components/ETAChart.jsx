// src/components/ETAChart.jsx
import React, { useRef, useEffect } from "react";

export default function ETAChart({ history = [], width = 140, height = 36 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // clear
    ctx.clearRect(0, 0, width, height);

    if (!history || history.length === 0) {
      // draw empty baseline
      ctx.strokeStyle = "#e6e6e6";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(2, height / 2);
      ctx.lineTo(width - 2, height / 2);
      ctx.stroke();
      return;
    }

    // extract speeds
    const speeds = history.map((h) => h.speed || 0);
    const max = Math.max(...speeds, 1);
    const min = Math.min(...speeds, 0);
    const range = Math.max(1, max - min);

    // path
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#2563eb";
    const pad = 2;
    const usableW = width - pad * 2;
    const usableH = height - pad * 2;
    speeds.forEach((s, i) => {
      const x = pad + (i / (speeds.length - 1 || 1)) * usableW;
      const y = pad + usableH - ((s - min) / range) * usableH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // fill gradient
    ctx.lineTo(pad + usableW, pad + usableH);
    ctx.lineTo(pad, pad + usableH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "rgba(37,99,235,0.12)");
    grad.addColorStop(1, "rgba(37,99,235,0.02)");
    ctx.fillStyle = grad;
    ctx.fill();
  }, [history, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        width,
        height,
        borderRadius: 6,
        background: "#fff",
      }}
    />
  );
}
