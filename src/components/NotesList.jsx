import React from 'react'
import NoteCard from './NoteCard'

export default function NotesList({ notes, onSelect, onDelete, onTogglePin, activeId }){
  return (
    <div className="w-96 border-r bg-gray-50 p-3 overflow-auto">
      {notes.length === 0 && <div className="p-4 text-sm text-gray-500">노트가 없습니다. 새 노트를 만들어보세요.</div>}
      <ul className="space-y-2">
        {notes.map(n=> (
          <li key={n.id}>
            <NoteCard note={n} onSelect={()=>onSelect(n.id)} onDelete={()=>onDelete(n.id)} onTogglePin={()=>onTogglePin(n.id)} isActive={n.id===activeId} />
          </li>
        ))}
      </ul>
    </div>
  )
}
