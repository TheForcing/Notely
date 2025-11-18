import React, { useState } from "react";

export default function TagInput({ tags = [], onChange }) {
  const [text, setText] = useState("");

  const addTag = () => {
    const t = text.trim();
    if (!t) return;
    if (tags.includes(t)) {
      setText("");
      return;
    }
    onChange([...tags, t]);
    setText("");
  };

  const removeTag = (t) => {
    onChange(tags.filter((x) => x !== t));
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-2">
        {tags.map((t) => (
          <span
            key={t}
            className="text-xs px-2 py-1 bg-gray-100 rounded-full flex items-center gap-2"
          >
            <span>{t}</span>
            <button
              className="text-xs text-red-500"
              onClick={() => removeTag(t)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="태그 입력 후 Enter"
          className="p-2 border rounded flex-1"
        />
        <button onClick={addTag} className="px-3 py-1 border rounded">
          추가
        </button>
      </div>
    </div>
  );
}
