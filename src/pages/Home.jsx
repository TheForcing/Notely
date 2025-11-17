import React from 'react'
import Sidebar from '../components/Sidebar'
import NotesList from '../components/NotesList'
import Editor from '../components/Editor'
import useNotes from '../hooks/useNotes'

export default function Home(){
  const { notes, rawNotes, createNote, updateNote, deleteNote, activeNoteId, setActiveNoteId, search, setSearch } = useNotes()

  return (
    <div className="flex h-screen">
      <Sidebar onCreate={createNote} search={search} setSearch={setSearch} />
      <div className="flex-1 flex">
        <NotesList notes={notes} onSelect={setActiveNoteId} onDelete={deleteNote} activeId={activeNoteId} />
        <Editor note={rawNotes.find(n=>n.id===activeNoteId)} onChange={updateNote} onDelete={deleteNote} />
      </div>
    </div>
  )
}
