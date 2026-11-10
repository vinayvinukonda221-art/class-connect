import React, { useState, useEffect } from 'react';
import { Plus, Tag, Trash2, Pin, Edit3 } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { OFFICIAL_SUBJECTS } from '../../constants/subjects';

export const Notes = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    // Form
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tag, setTag] = useState('');
    const [subject, setSubject] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [saving, setSaving] = useState(false);
    const fetchNotes = async () => {
        try {
            setLoading(true);
            const url = search ? `/user/notes?search=${encodeURIComponent(search)}` : '/user/notes';
            const res = await api.get(url);
            if (res.data.success) {
                setNotes(res.data.notes || []);
            }
        }
        catch (err) {
            console.error('Failed to fetch notes:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchNotes();
    }, [search]);
    const handleOpenCreate = () => {
        setEditingNote(null);
        setTitle('');
        setContent('');
        setTag('');
        setSubject('');
        setIsPinned(false);
        setModalOpen(true);
    };
    const handleOpenEdit = (note) => {
        setEditingNote(note);
        setTitle(note.title);
        setContent(note.content);
        setTag(note.tags?.[0] || '');
        setSubject(note.subject || '');
        setIsPinned(note.isPinned);
        setModalOpen(true);
    };
    const handleSaveNote = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                title,
                content,
                tags: tag ? [tag.trim()] : [],
                subject,
                isPinned,
            };
            if (editingNote) {
                await api.put(`/user/notes/${editingNote._id}`, payload);
            }
            else {
                await api.post('/user/notes', payload);
            }
            setModalOpen(false);
            await fetchNotes();
        }
        catch (err) {
            alert('Failed to save note: ' + err.message);
        }
        finally {
            setSaving(false);
        }
    };
    const handleDeleteNote = async (id) => {
        if (!confirm('Are you sure you want to delete this note?'))
            return;
        try {
            await api.delete(`/user/notes/${id}`);
            setNotes((prev) => prev.filter((n) => n._id !== id));
        }
        catch (err) {
            alert('Failed to delete note: ' + err.message);
        }
    };
    return (<div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E3E3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0D0D0D]">Personal Scratchpad</h1>
          <p className="text-xs text-[#4D4D4D] mt-0.5">
            Private markdown notes, shell scripts, lab viva hints, and faculty pointers for Section 21
          </p>
        </div>

        <Button onClick={handleOpenCreate} size="sm" variant="primary">
          <Plus className="w-4 h-4 mr-1.5"/>
          <span>New Note</span>
        </Button>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Input placeholder="Search personal notes..." value={search} onChange={(e) => setSearch(e.target.value)}/>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (<div className="col-span-full py-12 text-center text-xs text-[#888888]">Loading scratchpad...</div>) : notes.length === 0 ? (<div className="col-span-full py-12 text-center text-xs text-[#888888] bg-white border border-[#E3E3E3] rounded-lg">
            No notes found. Create your first quick note to record lab snippets or exam formulas.
          </div>) : (notes.map((note) => (<div key={note._id} className={`p-4 rounded-lg border border-[#E3E3E3] flex flex-col justify-between space-y-3 transition-colors ${note.isPinned ? 'bg-[#FFFDF0] ring-1 ring-amber-300' : 'bg-white hover:border-[#6C35F5]/30'}`}>
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#0D0D0D]">{note.title}</h3>
                  {note.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0"/>}
                </div>

                {note.subject && (<span className="text-[11px] font-mono text-[#6C35F5] font-medium block mt-0.5">
                    {note.subject}
                  </span>)}

                <p className="text-xs text-[#4D4D4D] mt-2 whitespace-pre-wrap leading-relaxed font-mono">
                  {note.content}
                </p>
              </div>

              <div className="pt-2 border-t border-[#E3E3E3]/60 flex items-center justify-between text-[11px] text-[#888888]">
                <div className="flex items-center gap-1 font-mono">
                  <Tag className="w-3 h-3"/>
                  <span>{note.tags?.[0] || 'Note'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenEdit(note)} className="p-1 text-[#4D4D4D] hover:text-[#6C35F5] transition-colors">
                    <Edit3 className="w-3.5 h-3.5"/>
                  </button>
                  <button onClick={() => handleDeleteNote(note._id)} className="p-1 text-[#888888] hover:text-[#D92D20] transition-colors">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            </div>)))}
      </div>

      {/* Note Edit / Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingNote ? 'Edit Note' : 'Create Scratchpad Note'} description="Private to your user account.">
        <form onSubmit={handleSaveNote} className="space-y-4">
          <Input label="Note Title" placeholder="e.g. Machine Learning Gradient Descent Proof" value={title} onChange={(e) => setTitle(e.target.value)} required/>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#4D4D4D]">Content</label>
            <textarea className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm font-sans placeholder:text-[#888888] focus:outline-none focus:border-[#6C35F5] min-h-[140px]" placeholder="Paste code snippet, proof, formula, or terminal command..." value={content} onChange={(e) => setContent(e.target.value)} required/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#4D4D4D]">Subject / Track</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5]">
                <option value="">General (No Subject)</option>
                {OFFICIAL_SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <Input label="Tag" placeholder="e.g. Snippet / Formula" value={tag} onChange={(e) => setTag(e.target.value)}/>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="pinNote" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="rounded-sm border-[#E3E3E3] text-[#6C35F5] focus:ring-[#6C35F5]"/>
            <label htmlFor="pinNote" className="text-xs text-[#0D0D0D] cursor-pointer">
              Pin note to top of scratchpad
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              {editingNote ? 'Update Note' : 'Save Note'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>);
};
