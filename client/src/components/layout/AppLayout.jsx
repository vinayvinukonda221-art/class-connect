import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNavBar } from './TopNavBar';
import { SideNavBar } from './SideNavBar';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
export const AppLayout = ({ children }) => {
    const [quickNoteOpen, setQuickNoteOpen] = useState(false);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [noteTag, setNoteTag] = useState('');
    const [savingNote, setSavingNote] = useState(false);
    const handleSaveQuickNote = async (e) => {
        e.preventDefault();
        if (!noteTitle || !noteContent)
            return;
        try {
            setSavingNote(true);
            await api.post('/user/notes', {
                title: noteTitle,
                content: noteContent,
                tags: noteTag ? [noteTag] : ['QuickNote'],
            });
            setNoteTitle('');
            setNoteContent('');
            setNoteTag('');
            setQuickNoteOpen(false);
        }
        catch (err) {
            alert('Failed to save note: ' + err.message);
        }
        finally {
            setSavingNote(false);
        }
    };
    return (<div className="min-h-screen bg-[#F8F8FB] flex flex-col font-sans">
      <TopNavBar />

      <div className="flex-1 flex w-full max-w-[1600px] mx-auto">
        <div className="hidden md:block">
          <SideNavBar onQuickNoteClick={() => setQuickNoteOpen(true)}/>
        </div>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>

      {/* Quick Note Modal */}
      <Modal isOpen={quickNoteOpen} onClose={() => setQuickNoteOpen(false)} title="Create Quick Note" description="Saved directly to your private Section 21 scratchpad.">
        <form onSubmit={handleSaveQuickNote} className="space-y-4">
          <Input label="Title" placeholder="e.g. DWM Viva question / Exam hint..." value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} required/>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#4D4D4D]">Note Content</label>
            <textarea className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm placeholder:text-[#888888] focus:outline-none focus:border-[#6C35F5] focus:ring-1 focus:ring-[#6C35F5] min-h-[120px]" placeholder="Paste code snippet, formula, or instructor notes..." value={noteContent} onChange={(e) => setNoteContent(e.target.value)} required/>
          </div>
          <Input label="Subject / Tag" placeholder="e.g. CompilerDesign, Viva, DWM" value={noteTag} onChange={(e) => setNoteTag(e.target.value)}/>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setQuickNoteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={savingNote}>
              Save Note
            </Button>
          </div>
        </form>
      </Modal>
    </div>);
};
