import React from 'react'

function excerpt(text, len=80){
  if(!text) return ''
  return text.length > len ? text.slice(0,len) + '...' : text
}

export default function NoteCard({ note, onSelect, onDelete, isActive }){
  return (
    <div className={`p-3 rounded border ${isActive ? 'bg-white shadow' : 'bg-white/80'}`}>
      <div className="flex justify-between items-start">
        <div onClick={onSelect} className="cursor-pointer">
          <div className="font-semibold">{note.title || 'Untitled'}</div>
          <div className="text-xs text-gray-500">{excerpt(note.body)}</div>
        </div>
        <div className="flex gap-2">
          <button className="text-xs text-red-500" onClick={onDelete}>삭제</button>
        </div>
      </div>
    </div>
  )
}
