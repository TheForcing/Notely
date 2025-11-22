import { useEffect, useState, useCallback, useRef } from 'react'
import { nanoid } from 'nanoid'
import { db } from '../firebase'
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { uploadUserFile, deleteUserFile } from '../firebase'

const STORAGE_KEY = 'notely_notes_v2'
const QUEUE_KEY = 'notely_queue_v1'

function loadJSON(key, fallback){ try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback }catch(e){ return fallback } }
function saveJSON(key, v){ try{ localStorage.setItem(key, JSON.stringify(v)) }catch(e){} }

export default function useNotes(){
  const [notes, setNotes] = useState(() => loadJSON(STORAGE_KEY, []))
  const [activeNoteId, setActiveNoteId] = useState(notes[0]?.id || null)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const queueRef = useRef(loadJSON(QUEUE_KEY, []))
  const userRef = useRef(null)
  const unsubSnapshotRef = useRef(null)

  useEffect(()=> saveJSON(STORAGE_KEY, notes), [notes])
  useEffect(()=> saveJSON(QUEUE_KEY, queueRef.current), [queueRef.current])

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (u) => {
      userRef.current = u
      if(u){ attachFirestoreListener(u.uid); processQueue(u.uid) } else { detachFirestoreListener() }
    })
    return () => unsub()
  }, [])

  useEffect(()=>{ const onOnline = ()=> { if(userRef.current) processQueue(userRef.current.uid) }; window.addEventListener('online', onOnline); return ()=> window.removeEventListener('online', onOnline) }, [])

  const attachFirestoreListener = (uid)=>{ try{ const q = query(collection(db, 'users', uid, 'notes'), orderBy('updatedAt','desc')); if(unsubSnapshotRef.current) unsubSnapshotRef.current(); unsubSnapshotRef.current = onSnapshot(q, snap => { const cloud = snap.docs.map(d => d.data()); setNotes(prev => { const map = new Map(prev.map(n=>[n.id,n])); cloud.forEach(c => { const local = map.get(c.id); if(!local) map.set(c.id, c); else if((c.updatedAt||0) > (local.updatedAt||0)) map.set(c.id, c); }); return Array.from(map.values()).sort((a,b)=> (b.pinned?1:0)-(a.pinned?1:0) || (b.updatedAt||0)-(a.updatedAt||0)) }) }) }catch(e){ console.error('attach listener', e) } }
  const detachFirestoreListener = ()=>{ if(unsubSnapshotRef.current){ unsubSnapshotRef.current(); unsubSnapshotRef.current = null } }

  const processQueue = async (uid)=>{ if(!uid) return; const q = queueRef.current.slice(); if(q.length===0) return; const remaining = []; for(const op of q){ try{ if(op.type==='upsert'){ await setDoc(doc(db, 'users', uid, 'notes', op.note.id), op.note) } else if(op.type==='delete'){ await deleteDoc(doc(db, 'users', uid, 'notes', op.id)) } else if(op.type==='upload'){ console.warn('skipping upload in queue because file data cannot be serialized') } }catch(e){ console.error('queue op failed', e); remaining.push(op) } } queueRef.current = remaining; saveJSON(QUEUE_KEY, queueRef.current) }

  const enqueue = (op)=>{ queueRef.current.push(op); saveJSON(QUEUE_KEY, queueRef.current) }

  const createNote = useCallback(async () => { const newNote = { id: nanoid(), title: 'Untitled', body: '', createdAt: Date.now(), updatedAt: Date.now(), tags: [], pinned: false, attachments: [] }; setNotes(prev=>[newNote, ...prev]); setActiveNoteId(newNote.id); const user = userRef.current; if(user && navigator.onLine){ try{ await setDoc(doc(db, 'users', user.uid, 'notes', newNote.id), newNote) }catch(e){ enqueue({type:'upsert', note:newNote}) } } else { enqueue({type:'upsert', note:newNote}) } return newNote }, [])

  const updateNote = useCallback(async (id, patch) => { setNotes(prev=>prev.map(n => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)); const updated = notes.find(n=>n.id===id); const toWrite = updated ? { ...updated, ...patch, updatedAt: Date.now() } : { id, ...patch, updatedAt: Date.now() }; const user = userRef.current; if(user && navigator.onLine){ try{ await setDoc(doc(db, 'users', user.uid, 'notes', id), toWrite) }catch(e){ enqueue({type:'upsert', note:toWrite}) } } else { enqueue({type:'upsert', note:toWrite}) } }, [notes])

  const deleteNote = useCallback(async (id) => { setNotes(prev=>prev.filter(n=>n.id!==id)); setActiveNoteId(prev => (prev === id ? null : prev)); const user = userRef.current; if(user && navigator.onLine){ try{ await deleteDoc(doc(db, 'users', user.uid, 'notes', id)) }catch(e){ enqueue({type:'delete', id}) } } else { enqueue({type:'delete', id}) } }, [])

  const togglePin = useCallback((id)=>{ setNotes(prev=>prev.map(n=> n.id===id ? {...n, pinned: !n.pinned, updatedAt: Date.now()} : n)); const updated = notes.find(n=>n.id===id); const toWrite = updated ? {...updated, pinned: !updated.pinned, updatedAt: Date.now()} : null; const user = userRef.current; if(toWrite){ if(user && navigator.onLine){ setDoc(doc(db, 'users', user.uid, 'notes', id), toWrite).catch(()=>enqueue({type:'upsert', note:toWrite})) } else enqueue({type:'upsert', note:toWrite}) } }, [notes])

  const uploadAttachment = useCallback(async (noteId, file) => { const user = userRef.current; if(!user) throw new Error('login required to upload'); const meta = await uploadUserFile(user.uid, noteId, file); setNotes(prev=>prev.map(n=> n.id===noteId ? {...n, attachments: [...(n.attachments||[]), meta], updatedAt: Date.now()} : n)); const updated = notes.find(n=>n.id===noteId); const toWrite = updated ? {...updated, attachments: [...(updated.attachments||[]), meta], updatedAt: Date.now()} : null; if(toWrite){ if(navigator.onLine){ try{ await setDoc(doc(db, 'users', user.uid, 'notes', noteId), toWrite) }catch(e){ enqueue({type:'upsert', note:toWrite}) } } else { enqueue({type:'upsert', note:toWrite}) } } return meta }, [notes])

  const removeAttachment = useCallback(async (noteId, attachment) => { try{ await deleteUserFile(attachment.path) }catch(e){ console.warn('delete file may have failed', e) } setNotes(prev=>prev.map(n=> n.id===noteId ? {...n, attachments: (n.attachments||[]).filter(a=>a.path!==attachment.path), updatedAt: Date.now()} : n)); const updated = notes.find(n=>n.id===noteId); const toWrite = updated ? {...updated, attachments: (updated.attachments||[]).filter(a=>a.path!==attachment.path), updatedAt: Date.now()} : null; const user = userRef.current; if(toWrite && user){ if(navigator.onLine){ setDoc(doc(db, 'users', user.uid, 'notes', noteId), toWrite).catch(()=>enqueue({type:'upsert', note:toWrite})) } else enqueue({type:'upsert', note:toWrite}) } }, [notes])

  const exportNotes = useCallback(()=> JSON.stringify({ exportedAt: Date.now(), notes }, null, 2), [notes])
  const importNotes = useCallback((jsonString)=>{ try{ const data = JSON.parse(jsonString); const incoming = Array.isArray(data) ? data : (data.notes || []); setNotes(prev => { const map = new Map(prev.map(n=>[n.id,n])); for(const inc of incoming){ const local = map.get(inc.id); if(!local) map.set(inc.id, inc); else if((inc.updatedAt||0) > (local.updatedAt||0)) map.set(inc.id, inc) } return Array.from(map.values()).sort((a,b)=> (b.pinned?1:0)-(a.pinned?1:0) || (b.updatedAt||0)-(a.updatedAt||0)) }); return true }catch(e){ console.error(e); return false } }, [])

  const filtered = notes.filter(n => { if(tagFilter){ const tags = (n.tags||[]).map(t=>t.toLowerCase()); if(!tags.includes(tagFilter.toLowerCase())) return false } if(!search) return true; const q = search.toLowerCase(); return (n.title + ' ' + n.body + ' ' + (n.tags||[]).join(' ')).toLowerCase().includes(q) }).sort((a,b)=> { if((a.pinned?1:0) !== (b.pinned?1:0)) return (b.pinned?1:0)-(a.pinned?1:0); return (b.updatedAt||0) - (a.updatedAt||0) })

  return { notes: filtered, rawNotes: notes, createNote, updateNote, deleteNote, togglePin, uploadAttachment, removeAttachment, activeNoteId, setActiveNoteId, search, setSearch, tagFilter, setTagFilter, exportNotes, importNotes, queue: queueRef.current }
}
