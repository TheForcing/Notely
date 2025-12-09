// src/components/ETAChart.jsx
import React, { useRef, useEffect, useState } from "react";

export default function ETAChart({ history = [], width = 180, height = 48 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const lastRenderedRef = useRef({ speeds: [] });
  const [hover, setHover] = useState(null); // {x,y,idx}

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // prepare speeds array padded to fixed length for smoothness
    const L = Math.max(12, Math.min(120, history.length || 12));
    const speeds = history.slice(-L).map((h) => h.speed || 0);
    // smoothing: linear interpolate from lastRenderedRef to new speeds
    const prev = lastRenderedRef.current.speeds || [];
    const target = speeds;
    const frames = 10;
    let frame = 0;

    const drawFrame = () => {
      const t = frame / frames;
      const interp = target.map((v, i) => {
        const pv = prev[i] || 0;
        return pv + (v - pv) * t;
      });
      // draw
      ctx.clearRect(0, 0, width, height);
      // background grid line (middle)
      const max = Math.max(...(target.length ? target : [1]), 1);
      const midY = height / 2;
      ctx.strokeStyle = "#eef2ff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(2, midY);
      ctx.lineTo(width - 2, midY);
      ctx.stroke();

      // path
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#2563eb";
      const pad = 4;
      const usableW = width - pad * 2;
      const usableH = height - pad * 2;
      const rng = Math.max(1, max);
      interp.forEach((s, i) => {
        const x = pad + (i / (interp.length - 1 || 1)) * usableW;
        const y = pad + usableH - (s / rng) * usableH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // fill with gradient
      ctx.lineTo(pad + usableW, pad + usableH);
      ctx.lineTo(pad, pad + usableH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "rgba(37,99,235,0.12)");
      grad.addColorStop(1, "rgba(37,99,235,0.02)");
      ctx.fillStyle = grad;
      ctx.fill();

      // draw tooltip if hover available
      if (hover && interp.length) {
        const idx = Math.max(0, Math.min(interp.length - 1, hover.idx));
        const s = Math.round(interp[idx]);
        const x = pad + (idx / (interp.length - 1 || 1)) * usableW;
        const y = pad + usableH - (interp[idx] / rng) * usableH;
        // small circle
        ctx.fillStyle = "#2563eb";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        // tooltip box
        const txt = `${s} B/s`;
        ctx.font = "11px system-ui";
        const tw = ctx.measureText(txt).width + 10;
        const th = 18;
        let tx = x + 8;
        if (tx + tw > width - 4) tx = x - 8 - tw;
        const ty = Math.max(4, y - th - 6);
        ctx.fillStyle = "rgba(15,23,42,0.95)";
        roundRect(ctx, tx, ty, tw, th, 6, true, false);
        ctx.fillStyle = "#fff";
        ctx.fillText(txt, tx + 6, ty + 12);
      }

      frame++;
      if (frame <= frames) {
        rafRef.current = requestAnimationFrame(drawFrame);
      } else {
        lastRenderedRef.current.speeds = interp.slice();
      }
    };

    cancelAnimation();
    rafRef.current = requestAnimationFrame(drawFrame);

    function cancelAnimation() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    return () => {
      cancelAnimation();
    };
  }, [history, width, height, hover]);

  // pointer handling on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pad = 4;
      const usableW = width - pad * 2;
      const L = Math.max(12, Math.min(120, history.length || 12));
      const rel = Math.max(0, Math.min(1, (x - pad) / usableW));
      const idx = Math.round(rel * (L - 1));
      setHover({ x, y, idx });
    };
    const onLeave = () => setHover(null);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [history, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        width: width + "px",
        height: height + "px",
        borderRadius: 6,
        background: "#fff",
      }}
    />
  );

  // helper
  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof r === "undefined") r = 5;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
}
