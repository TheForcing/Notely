import React from 'react'
import Sidebar from '../components/Sidebar'
import NotesList from '../components/NotesList'
import Editor from '../components/EditorWithProgress'
import useNotes from '../hooks/useNotes'

export default function Home(){
  const { notes, rawNotes, createNote, updateNote, deleteNote, activeNoteId, setActiveNoteId, uploadAttachment, removeAttachment } = useNotes()

  return (
    <div style={{display:'flex', height:'100vh'}}>
      <Sidebar onCreate={createNote} search={''} setSearch={()=>{}} tagFilter={''} setTagFilter={()=>{}} exportNotes={()=>JSON.stringify({notes})} />
      <div style={{flex:1, display:'flex'}}>
        <NotesList notes={notes} onSelect={setActiveNoteId} onDelete={deleteNote} onTogglePin={()=>{}} activeId={activeNoteId} />
        <Editor note={rawNotes.find(n=>n.id===activeNoteId)} onChange={updateNote} onDelete={deleteNote} onTogglePin={()=>{}} uploadAttachment={uploadAttachment} removeAttachment={removeAttachment} />
      </div>
    </div>
  )
}
