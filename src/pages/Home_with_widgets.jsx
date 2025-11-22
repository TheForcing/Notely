import React from 'react'
import Sidebar from '../components/SidebarWithSettings'
import NotesList from '../components/NotesList'
import Editor from '../components/EditorWithAttachments'
import useNotes from '../hooks/useNotes'
export default function Home(){ const { notes, rawNotes, createNote, updateNote, deleteNote, activeNoteId, setActiveNoteId, search, setSearch, tagFilter, setTagFilter, exportNotes, importNotes, togglePin, uploadAttachment, removeAttachment } = useNotes(); return (<div className='flex h-screen'><Sidebar onCreate={createNote} search={search} setSearch={setSearch} tagFilter={tagFilter} setTagFilter={setTagFilter} exportNotes={exportNotes} importNotes={importNotes} /><div className='flex-1 flex'><NotesList notes={notes} onSelect={setActiveNoteId} onDelete={deleteNote} onTogglePin={togglePin} activeId={activeNoteId} /><Editor note={rawNotes.find(n=>n.id===activeNoteId)} onChange={updateNote} onDelete={deleteNote} onTogglePin={togglePin} uploadAttachment={uploadAttachment} removeAttachment={removeAttachment} /></div></div>) }
