import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
export const Reminders = () => {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('medium');
    const [module, setModule] = useState('assignment');
    const [saving, setSaving] = useState(false);
    const fetchReminders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/user/reminders');
            if (res.data.success) {
                setReminders(res.data.reminders || []);
            }
        }
        catch (err) {
            console.error('Failed to fetch reminders:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchReminders();
    }, []);
    const handleToggle = async (id) => {
        try {
            await api.patch(`/user/reminders/${id}/toggle`);
            setReminders((prev) => prev.map((r) => (r._id === id ? { ...r, isCompleted: !r.isCompleted } : r)));
        }
        catch (err) {
            alert('Failed to toggle reminder: ' + err.message);
        }
    };
    const handleDelete = async (id) => {
        try {
            await api.delete(`/user/reminders/${id}`);
            setReminders((prev) => prev.filter((r) => r._id !== id));
        }
        catch (err) {
            alert('Failed to delete reminder: ' + err.message);
        }
    };
    const handleCreateReminder = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await api.post('/user/reminders', {
                title,
                description,
                dueDate,
                priority,
                relatedModule: module,
            });
            setTitle('');
            setDescription('');
            setDueDate('');
            setModalOpen(false);
            await fetchReminders();
        }
        catch (err) {
            alert('Failed to create reminder: ' + err.message);
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E3E3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0D0D0D]">Academic Reminders</h1>
          <p className="text-xs text-[#4D4D4D] mt-0.5">
            Personal deadlines, exam countdowns, and scheduled alerts for Section 21
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)} size="sm" variant="primary">
          <Plus className="w-4 h-4 mr-1.5"/>
          <span>Add Reminder</span>
        </Button>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {loading ? (<div className="py-12 text-center text-xs text-[#888888]">Loading reminders...</div>) : reminders.length === 0 ? (<div className="py-12 text-center text-xs text-[#888888] bg-white border border-[#E3E3E3] rounded-lg">
            No reminders scheduled. Click "Add Reminder" to keep track of academic deadlines.
          </div>) : (reminders.map((r) => {
            const isDueSoon = new Date(r.dueDate).getTime() - Date.now() < 24 * 60 * 60 * 1000;
            return (<Card key={r._id} className={`flex items-center justify-between p-4 transition-colors ${r.isCompleted ? 'opacity-60 bg-[#F8F8FB]' : 'hover:border-[#6C35F5]/30'}`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => handleToggle(r._id)} className="mt-0.5 text-[#6C35F5] hover:scale-110 transition-transform">
                    {r.isCompleted ? (<CheckCircle2 className="w-5 h-5 text-[#1F8A5B]"/>) : (<Circle className="w-5 h-5 text-[#888888] hover:text-[#6C35F5]"/>)}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-semibold text-[#0D0D0D] ${r.isCompleted ? 'line-through text-[#888888]' : ''}`}>
                        {r.title}
                      </h3>
                      <Badge variant={r.priority === 'high' ? 'error' : r.priority === 'medium' ? 'purple' : 'neutral'}>
                        {r.priority.toUpperCase()}
                      </Badge>
                    </div>

                    {r.description && (<p className="text-xs text-[#4D4D4D] mt-0.5">{r.description}</p>)}

                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#888888] mt-1.5">
                      <Calendar className="w-3.5 h-3.5"/>
                      <span>{new Date(r.dueDate).toLocaleString()}</span>
                      {isDueSoon && !r.isCompleted && (<span className="text-[#D92D20] font-semibold flex items-center gap-1 ml-2">
                          <AlertCircle className="w-3 h-3"/>
                          <span>Due within 24h</span>
                        </span>)}
                    </div>
                  </div>
                </div>

                <button onClick={() => handleDelete(r._id)} className="p-1.5 text-[#888888] hover:text-[#D92D20] transition-colors rounded-sm">
                  <Trash2 className="w-4 h-4"/>
                </button>
              </Card>);
        }))}
      </div>

      {/* Add Reminder Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Schedule Academic Reminder" description="Receive reminders for course deadlines and assessments.">
        <form onSubmit={handleCreateReminder} className="space-y-4">
          <Input label="Reminder Title" placeholder="e.g. Submit Machine Learning Model Evaluation Report" value={title} onChange={(e) => setTitle(e.target.value)} required/>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#4D4D4D]">Description (Optional)</label>
            <textarea className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5] min-h-[70px]" placeholder="Notes or instructions..." value={description} onChange={(e) => setDescription(e.target.value)}/>
          </div>

          <Input label="Due Date & Time" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required/>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#4D4D4D]">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5]">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High (Urgent)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#4D4D4D]">Category</label>
              <select value={module} onChange={(e) => setModule(e.target.value)} className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5]">
                <option value="assignment">Assignment</option>
                <option value="exam">Exam Assessment</option>
                <option value="project">Project Milestone</option>
                <option value="personal">Personal Study</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              Save Reminder
            </Button>
          </div>
        </form>
      </Modal>
    </div>);
};
