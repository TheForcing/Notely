import { useEffect, useState, useCallback } from "react";
import { nanoid } from "nanoid";
// (Firebase imports left as-is if present in your project)

const STORAGE_KEY = "notely_notes_v1";

export default function useNotes() {
  const [notes, setNotes] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [activeNoteId, setActiveNoteId] = useState(notes[0]?.id || null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState(""); // 새: 태그 필터

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {}
  }, [notes]);

  const createNote = useCallback(() => {
    const newNote = {
      id: nanoid(),
      title: "Untitled",
      body: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    return newNote;
  }, []);

  const updateNote = useCallback((id, patch) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n
      )
    );
  }, []);

  const deleteNote = useCallback((id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setActiveNoteId((prev) => (prev === id ? null : prev));
  }, []);

  // export notes as JSON string (for backup)
  const exportNotes = useCallback(() => {
    try {
      return JSON.stringify({ exportedAt: Date.now(), notes }, null, 2);
    } catch (e) {
      console.error("export failed", e);
      return null;
    }
  }, [notes]);

  // import notes from JSON (merges by id, newer wins)
  const importNotes = useCallback((jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data || (!Array.isArray(data.notes) && !Array.isArray(data))) {
        // support structure { notes: [...] } or direct array
      }
      const incoming = Array.isArray(data) ? data : data.notes || [];
      setNotes((prev) => {
        const map = new Map(prev.map((n) => [n.id, n]));
        for (const inc of incoming) {
          const local = map.get(inc.id);
          if (!local) map.set(inc.id, inc);
          else {
            if ((inc.updatedAt || 0) > (local.updatedAt || 0))
              map.set(inc.id, inc);
          }
        }
        return Array.from(map.values()).sort(
          (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
        );
      });
      return true;
    } catch (e) {
      console.error("import failed", e);
      return false;
    }
  }, []);

  const filtered = notes.filter((n) => {
    if (tagFilter) {
      const tags = (n.tags || []).map((t) => t.toLowerCase());
      if (!tags.includes(tagFilter.toLowerCase())) return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (n.title + " " + n.body + " " + (n.tags || []).join(" "))
      .toLowerCase()
      .includes(q);
  });

  return {
    notes: filtered,
    rawNotes: notes,
    createNote,
    updateNote,
    deleteNote,
    activeNoteId,
    setActiveNoteId,
    search,
    setSearch,
    tagFilter,
    setTagFilter,
    exportNotes,
    importNotes,
  };
}
