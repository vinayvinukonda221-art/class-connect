import React, { useState, useEffect } from 'react';
import { Plus, MapPin, User, Edit2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { OFFICIAL_SUBJECTS } from '../../constants/subjects';

export const Timetable = () => {
    const { isAdmin } = useAuth();
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState('Monday');
    // Admin edit/create entry modal
    const [modalOpen, setModalOpen] = useState(false);
    const [day, setDay] = useState('Monday');
    const [periodNumber, setPeriodNumber] = useState(1);
    const [startTime, setStartTime] = useState('08:30');
    const [endTime, setEndTime] = useState('09:20');
    const [subject, setSubject] = useState(OFFICIAL_SUBJECTS[0]);
    const [facultyName, setFacultyName] = useState('Faculty Member');
    const [roomNumber, setRoomNumber] = useState('Room 304');
    const [type, setType] = useState('theory');
    const [saving, setSaving] = useState(false);
    const fetchTimetable = async () => {
        try {
            setLoading(true);
            const res = await api.get('/academic/timetable');
            if (res.data.success) {
                setTimetable(res.data.timetable || []);
            }
        }
        catch (err) {
            console.error('Error fetching timetable:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchTimetable();
    }, []);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periodsForDay = timetable
        .filter((t) => t.day === selectedDay)
        .sort((a, b) => a.periodNumber - b.periodNumber);
    const handleSaveEntry = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await api.post('/academic/timetable', {
                day,
                periodNumber: Number(periodNumber),
                startTime,
                endTime,
                subject,
                facultyName,
                roomNumber,
                type,
            });
            setModalOpen(false);
            await fetchTimetable();
        }
        catch (err) {
            alert('Failed to save timetable entry: ' + err.message);
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E3E3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0D0D0D]">Weekly Class Timetable</h1>
          <p className="text-xs text-[#4D4D4D] mt-0.5">
            CSE Section 21 · Semester VI schedule, lab slots, room locations, and faculty in-charges
          </p>
        </div>

        {isAdmin && (<Button onClick={() => setModalOpen(true)} size="sm" variant="primary">
            <Plus className="w-4 h-4 mr-1.5"/>
            <span>Update / Add Period</span>
          </Button>)}
      </div>

      {/* Days Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2">
        {days.map((d) => (<button key={d} onClick={() => setSelectedDay(d)} className={`px-4 py-2 rounded-sm text-xs font-medium transition-colors ${selectedDay === d
                ? 'bg-[#0D0D0D] text-white font-semibold'
                : 'bg-white border border-[#E3E3E3] text-[#4D4D4D] hover:text-[#0D0D0D] hover:bg-[#F8F8FB]'}`}>
            {d}
          </button>))}
      </div>

      {/* Daily Periods Timeline */}
      <div className="space-y-3">
        {loading ? (<div className="py-12 text-center text-xs text-[#888888]">Loading timetable...</div>) : periodsForDay.length === 0 ? (<div className="py-12 text-center text-xs text-[#888888] bg-white border border-[#E3E3E3] rounded-lg">
            No classes scheduled for {selectedDay}.
          </div>) : (periodsForDay.map((entry) => (<Card key={entry._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#6C35F5]/30 transition-colors">
              <div className="flex items-start sm:items-center gap-4">
                {/* Period Badge */}
                <div className="w-12 h-12 rounded-sm bg-[#F4F0FF] border border-purple-200 flex flex-col items-center justify-center text-[#6C35F5] shrink-0 font-mono">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Per</span>
                  <span className="text-sm font-bold">{entry.periodNumber}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={entry.type === 'lab' ? 'deploying' : 'purple'}>
                      {entry.type.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-mono text-[#888888]">
                      {entry.startTime} – {entry.endTime}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#0D0D0D] mt-1">{entry.subject}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#4D4D4D] mt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#888888]"/>
                      <span>{entry.facultyName}</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-[#6C35F5]"/>
                      <span>{entry.roomNumber}</span>
                    </span>
                  </div>
                </div>
              </div>

              {isAdmin && (<Button size="sm" variant="secondary" onClick={() => {
                    setDay(entry.day);
                    setPeriodNumber(entry.periodNumber);
                    setStartTime(entry.startTime);
                    setEndTime(entry.endTime);
                    setSubject(entry.subject);
                    setFacultyName(entry.facultyName);
                    setRoomNumber(entry.roomNumber);
                    setType(entry.type);
                    setModalOpen(true);
                }}>
                  <Edit2 className="w-3.5 h-3.5 mr-1"/>
                  <span>Edit</span>
                </Button>)}
            </Card>)))}
      </div>

      {/* Admin Edit / Add Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Configure Timetable Period" description="Set period timing, subject, instructor, and classroom.">
        <form onSubmit={handleSaveEntry} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#4D4D4D]">Day of Week</label>
              <select value={day} onChange={(e) => setDay(e.target.value)} className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5]">
                {days.map((d) => (<option key={d} value={d}>
                    {d}
                  </option>))}
              </select>
            </div>

            <Input label="Period Number (1-8)" type="number" min="1" max="8" value={periodNumber} onChange={(e) => setPeriodNumber(Number(e.target.value))} required/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Time (e.g. 08:30)" value={startTime} onChange={(e) => setStartTime(e.target.value)} required/>
            <Input label="End Time (e.g. 09:20)" value={endTime} onChange={(e) => setEndTime(e.target.value)} required/>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#4D4D4D]">Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5]">
              {OFFICIAL_SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Faculty Name" placeholder="e.g. Prof. S. Ramesh" value={facultyName} onChange={(e) => setFacultyName(e.target.value)} required/>
            <Input label="Room Number / Lab" placeholder="e.g. Room 304 / Lab 402" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} required/>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#4D4D4D]">Period Session Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5]">
              <option value="theory">Theory Class</option>
              <option value="lab">Laboratory Practical</option>
              <option value="seminar">Technical Seminar</option>
              <option value="library">Library / Self Study</option>
              <option value="sports">Sports / Extracurricular</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              Save Timetable Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>);
};
