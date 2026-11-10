import React, { useState, useEffect } from 'react';
import { Plus, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { OFFICIAL_SUBJECTS } from '../../constants/subjects';

export const Seminars = () => {
    const { user } = useAuth();
    const [seminars, setSeminars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    // Form states
    const [topic, setTopic] = useState('');
    const [subject, setSubject] = useState(OFFICIAL_SUBJECTS[0]);
    const [speaker, setSpeaker] = useState(user?.name || '');
    const [speakerRoll, setSpeakerRoll] = useState(user?.rollNumber || '');
    const [presentationDate, setPresentationDate] = useState('');
    const [description, setDescription] = useState('');
    const [slideUrl, setSlideUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const fetchSeminars = async () => {
        try {
            setLoading(true);
            const res = await api.get('/academic/seminars');
            if (res.data.success) {
                setSeminars(res.data.seminars || []);
            }
        }
        catch (err) {
            console.error('Error fetching seminars:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchSeminars();
    }, []);
    const handleCreateSeminar = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await api.post('/academic/seminars', {
                topic,
                subject,
                speaker,
                speakerRollNumber: speakerRoll,
                presentationDate,
                description,
                slideUrl,
            });
            setTopic('');
            setDescription('');
            setSlideUrl('');
            setModalOpen(false);
            await fetchSeminars();
        }
        catch (err) {
            alert('Failed to register seminar: ' + err.message);
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E3E3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0D0D0D]">Student Technical Seminars</h1>
          <p className="text-xs text-[#4D4D4D] mt-0.5">
            Seminar schedules, presentation slide decks, and peer evaluation feedback for Section 21
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)} size="sm" variant="primary">
          <Plus className="w-4 h-4 mr-1.5"/>
          <span>Register Seminar</span>
        </Button>
      </div>

      {/* Seminars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (<div className="col-span-full py-12 text-center text-xs text-[#888888]">Loading seminars...</div>) : seminars.length === 0 ? (<div className="col-span-full py-12 text-center text-xs text-[#888888] bg-white border border-[#E3E3E3] rounded-lg">
            No technical seminars registered yet. Click "Register Seminar" to submit your topic.
          </div>) : (seminars.map((item) => (<Card key={item._id} className="flex flex-col justify-between space-y-4 hover:border-[#6C35F5]/30 transition-colors">
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={item.status === 'completed' ? 'live' : 'purple'}>
                    {item.status.toUpperCase()}
                  </Badge>
                  <span className="text-xs font-mono text-[#888888]">
                    {new Date(item.presentationDate).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#0D0D0D] leading-snug">{item.topic}</h3>
                  <span className="text-xs text-[#6C35F5] font-medium block mt-0.5">{item.subject}</span>
                  <p className="text-xs text-[#4D4D4D] mt-2 leading-relaxed">{item.description}</p>
                </div>

                <div className="flex items-center gap-2 pt-2 text-xs text-[#0D0D0D]">
                  <div className="w-6 h-6 rounded-full bg-[#F4F0FF] flex items-center justify-center text-[10px] font-mono font-bold text-[#6C35F5]">
                    {item.speaker?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <span className="font-medium">{item.speaker}</span>
                    <span className="text-[#888888] font-mono ml-1.5 text-[11px]">{item.speakerRollNumber}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E3E3E3] flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#888888]">Seminar Hall 2 · 11:25 AM</span>
                {item.slideUrl ? (<a href={item.slideUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6C35F5] font-medium hover:underline flex items-center gap-1">
                    <span>View Slides (Drive)</span>
                    <ExternalLink className="w-3 h-3"/>
                  </a>) : (<span className="text-xs text-[#888888]">No slides uploaded</span>)}
              </div>
            </Card>)))}
      </div>

      {/* Register Seminar Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Schedule Technical Seminar" description="Book your seminar topic presentation for CSE Section 21.">
        <form onSubmit={handleCreateSeminar} className="space-y-4">
          <Input label="Seminar Topic" placeholder="e.g. Zero Knowledge Rollups in Distributed Systems" value={topic} onChange={(e) => setTopic(e.target.value)} required/>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#4D4D4D]">Subject Track</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5]">
              {OFFICIAL_SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Speaker Name" value={speaker} onChange={(e) => setSpeaker(e.target.value)} required/>
            <Input label="Roll Number" value={speakerRoll} onChange={(e) => setSpeakerRoll(e.target.value)} required/>
          </div>

          <Input label="Presentation Date" type="date" value={presentationDate} onChange={(e) => setPresentationDate(e.target.value)} required/>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#4D4D4D]">Abstract / Description</label>
            <textarea className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5] min-h-[80px]" placeholder="Summary of concepts you will cover..." value={description} onChange={(e) => setDescription(e.target.value)} required/>
          </div>

          <Input label="Slides Presentation Link (Google Slides / Drive PDF)" placeholder="https://docs.google.com/presentation/d/..." value={slideUrl} onChange={(e) => setSlideUrl(e.target.value)}/>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              Confirm Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>);
};
