import React from "react";
import AuthBar from "./AuthBar";

export default function Sidebar({ onCreate, search, setSearch }) {
  return (
    <aside className="w-80 border-r bg-white p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">Notely</h2>
        </div>
        <button
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded"
          onClick={onCreate}
        >
          New
        </button>
      </div>

      <AuthBar />

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="검색 (제목/본문/태그)"
        className="p-2 border rounded"
      />
      <div className="flex-1 overflow-auto">
        {/* 추가 필터 UI 가능(태그, 즐겨찾기 등) */}
        {/* Sidebar 내부에 추가 */}
        <div className="mt-2">
          <div className="text-xs text-gray-500 mb-1">태그 필터</div>
          <input
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            placeholder="태그로 필터(예: work)"
            className="p-2 border rounded w-full"
          />
        </div>
      </div>
      <button
        onClick={() => {
          const txt = exportNotes();
          if (!txt) return alert("내보내기 실패");
          const blob = new Blob([txt], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `notely_export_${Date.now()}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }}
        className="w-full py-2 border rounded mt-2"
      >
        내보내기 (JSON)
      </button>

      <label className="w-full mt-2 block">
        <div className="text-xs text-gray-500 mb-1">가져오기 (JSON)</div>
        <input
          type="file"
          accept="application/json"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const txt = await f.text();
            const ok = importNotes(txt);
            alert(ok ? "가져오기 완료" : "가져오기 실패");
          }}
        />
      </label>

      <div className="text-xs text-gray-500">Autosave • Markdown preview</div>
    </aside>
  );
}
