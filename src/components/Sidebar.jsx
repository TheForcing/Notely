import React from 'react'
import AuthBar from './AuthBar'

export default function Sidebar({ onCreate, search, setSearch }){
  return (
    <aside className="w-80 border-r bg-white p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">Notely</h2>
        </div>
        <button className="text-sm px-3 py-1 bg-blue-600 text-white rounded" onClick={onCreate}>New</button>
      </div>

      <AuthBar />

      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="검색 (제목/본문/태그)" className="p-2 border rounded" />
      <div className="flex-1 overflow-auto">
        {/* 추가 필터 UI 가능(태그, 즐겨찾기 등) */}
      </div>
      <div className="text-xs text-gray-500">Autosave • Markdown preview</div>
    </aside>
  )
}
