import React, { useEffect, useState } from 'react'
import { marked } from 'marked'

export default function Editor({ note, onChange, onDelete }){
  const [draft, setDraft] = useState(note || { title: '', body: '' })

  useEffect(()=>{
    setDraft(note || { title: '', body: '' })
  }, [note])

  // autosave debounce
  useEffect(()=>{
    if(!note) return
    const id = setTimeout(()=>{
      if(draft.title !== note.title || draft.body !== note.body){
        onChange(note.id, { title: draft.title, body: draft.body })
      }
    }, 700)
    return ()=>clearTimeout(id)
  }, [draft, note, onChange])

  if(!note) return <div className="flex-1 p-6">노트를 선택하거나 새 노트를 만들어주세요.</div>

  return (
    <div className="flex-1 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <input className="text-2xl font-semibold p-2 border rounded w-full mr-4" value={draft.title} onChange={e=>setDraft(s=>({...s, title:e.target.value}))} placeholder="제목" />
        <button className="text-sm text-red-600" onClick={()=>onDelete(note.id)}>삭제</button>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4">
        <textarea value={draft.body} onChange={e=>setDraft(s=>({...s, body:e.target.value}))} className="w-full h-full p-3 border rounded resize-none" />
        <div className="prose overflow-auto p-3 border rounded">
          <div dangerouslySetInnerHTML={{ __html: marked.parse(draft.body || '') }} />
        </div>
      </div>
    </div>
  )
}
