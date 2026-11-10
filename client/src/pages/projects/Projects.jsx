import React, { useState, useEffect } from 'react';
import { Plus, Users, Github, ExternalLink, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { OFFICIAL_SUBJECTS } from '../../constants/subjects';

export const Projects = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState(OFFICIAL_SUBJECTS[0]);
    const [githubUrl, setGithubUrl] = useState('');
    const [deadline, setDeadline] = useState('');
    const [teamRolls, setTeamRolls] = useState('');
    const [progress, setProgress] = useState(25);
    const [saving, setSaving] = useState(false);
    const fetchProjects = async () => {
        try {
            setLoading(true);
            const res = await api.get('/academic/projects');
            if (res.data.success) {
                setProjects(res.data.projects || []);
            }
        }
        catch (err) {
            console.error('Error fetching projects:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchProjects();
    }, []);
    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const members = teamRolls
                .split(',')
                .map((r) => r.trim())
                .filter(Boolean)
                .map((roll) => ({ name: 'Team Member', rollNumber: roll }));
            if (!members.some((m) => m.rollNumber === user?.rollNumber)) {
                members.unshift({ name: user?.name || 'Leader', rollNumber: user?.rollNumber || 'S21' });
            }
            await api.post('/academic/projects', {
                title,
                description,
                subject,
                githubUrl,
                deadline: deadline || undefined,
                teamMembers: members,
                progressPercentage: Number(progress),
            });
            setTitle('');
            setDescription('');
            setGithubUrl('');
            setTeamRolls('');
            setModalOpen(false);
            await fetchProjects();
        }
        catch (err) {
            alert('Failed to register project: ' + err.message);
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E3E3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0D0D0D]">Course Projects & Teams</h1>
          <p className="text-xs text-[#4D4D4D] mt-0.5">
            Collaborative course mini-projects, team roster tracking, and repository links
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)} size="sm" variant="primary">
          <Plus className="w-4 h-4 mr-1.5"/>
          <span>Register Project</span>
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (<div className="col-span-full py-12 text-center text-xs text-[#888888]">Loading projects...</div>) : projects.length === 0 ? (<div className="col-span-full py-12 text-center text-xs text-[#888888] bg-white border border-[#E3E3E3] rounded-lg">
            No projects registered yet. Click "Register Project" to create your team project.
          </div>) : (projects.map((proj) => (<Card key={proj._id} className="flex flex-col justify-between space-y-4 hover:border-[#6C35F5]/30 transition-colors">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={proj.status === 'completed' ? 'live' : 'purple'}>
                    {proj.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-xs font-mono font-semibold text-[#6C35F5]">
                    {proj.progressPercentage}% Complete
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#0D0D0D]">{proj.title}</h3>
                  <span className="text-xs text-[#6C35F5] font-medium block mt-0.5">{proj.subject}</span>
                  <p className="text-xs text-[#4D4D4D] mt-2 leading-relaxed">{proj.description}</p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#EEEEEE] rounded-full h-1.5">
                  <div className="bg-[#6C35F5] h-1.5 rounded-full" style={{ width: `${proj.progressPercentage}%` }}/>
                </div>

                {/* Team Members */}
                <div className="pt-2">
                  <span className="text-[11px] font-mono text-[#888888] block mb-1.5 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5"/>
                    <span>Team Members:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {proj.teamMembers?.map((m, idx) => (<span key={idx} className="px-2 py-0.5 bg-[#F8F8FB] border border-[#E3E3E3] rounded-sm text-[11px] font-mono text-[#0D0D0D]">
                        {m.rollNumber} {m.name !== 'Team Member' ? `(${m.name})` : ''}
                      </span>))}
                  </div>
                </div>
              </div>

              {/* Bottom links */}
              <div className="pt-3 border-t border-[#E3E3E3] flex items-center justify-between text-xs">
                {proj.deadline && (<span className="text-[11px] font-mono text-[#888888] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5"/>
                    <span>Due: {new Date(proj.deadline).toLocaleDateString()}</span>
                  </span>)}

                {proj.githubUrl ? (<a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0D0D0D] font-medium hover:text-[#6C35F5] flex items-center gap-1.5 ml-auto">
                    <Github className="w-3.5 h-3.5"/>
                    <span>GitHub Repo</span>
                    <ExternalLink className="w-3 h-3"/>
                  </a>) : (<span className="text-xs text-[#888888] ml-auto">No public repo</span>)}
              </div>
            </Card>)))}
      </div>

      {/* Register Project Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Project / Team" description="Add your course project details for CSE Section 21.">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input label="Project Title" placeholder="e.g. Distributed KV Store with Raft" value={title} onChange={(e) => setTitle(e.target.value)} required/>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#4D4D4D]">Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5]">
              {OFFICIAL_SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#4D4D4D]">Project Description</label>
            <textarea className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5] min-h-[90px]" placeholder="State goals, architecture, tech stack, and deliverables..." value={description} onChange={(e) => setDescription(e.target.value)} required/>
          </div>

          <Input label="Team Member Roll Numbers (Comma Separated)" placeholder="e.g. 211FA04021, 211FA04022, 211FA04023" value={teamRolls} onChange={(e) => setTeamRolls(e.target.value)} helperText="Include roll numbers of your teammates."/>

          <Input label="GitHub Repository Link" placeholder="https://github.com/..." value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)}/>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Estimated Deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}/>
            <Input label="Progress Percentage (0-100)" type="number" min="0" max="100" value={progress} onChange={(e) => setProgress(Number(e.target.value))}/>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              Register Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>);
};
