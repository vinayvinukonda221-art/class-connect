import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { OFFICIAL_SUBJECTS } from '../../constants/subjects';

export const Attendance = () => {
    const { user, isAdmin } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    // Admin update modal
    const [modalOpen, setModalOpen] = useState(false);
    const [studentId, setStudentId] = useState(user?.id || '');
    const [subject, setSubject] = useState(OFFICIAL_SUBJECTS[0]);
    const [totalClasses, setTotalClasses] = useState(36);
    const [attendedClasses, setAttendedClasses] = useState(32);
    const [saving, setSaving] = useState(false);
    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const res = await api.get('/academic/attendance');
            if (res.data.success && res.data.attendance) {
                setData(res.data.attendance);
            }
        }
        catch (err) {
            console.error('Failed to fetch attendance:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchAttendance();
    }, []);
    const handleUpdateAttendance = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await api.post('/academic/attendance', {
                studentId,
                subject,
                totalClasses: Number(totalClasses),
                attendedClasses: Number(attendedClasses),
            });
            setModalOpen(false);
            await fetchAttendance();
        }
        catch (err) {
            alert('Failed to update attendance: ' + err.message);
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E3E3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0D0D0D]">Attendance & Shortage Tracker</h1>
          <p className="text-xs text-[#4D4D4D] mt-0.5">
            VFSTR University 75% minimum threshold monitoring, class buffer analysis, and subject breakdown
          </p>
        </div>

        {isAdmin && (<Button onClick={() => setModalOpen(true)} size="sm" variant="primary">
            <Plus className="w-4 h-4 mr-1.5"/>
            <span>Update Student Attendance</span>
          </Button>)}
      </div>

      {/* Summary Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Overall Percentage */}
        <Card className="flex flex-col justify-between">
          <span className="text-xs font-medium text-[#888888]">Consolidated Percentage</span>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-[#0D0D0D]">
                {data?.overallPercentage ?? 0}%
              </span>
              <span className="text-xs font-mono text-[#888888]">/ 75% Required</span>
            </div>
            <div className="w-full bg-[#EEEEEE] rounded-full h-2 mt-2">
              <div className={`h-2 rounded-full ${(data?.overallPercentage ?? 0) >= 75 ? 'bg-[#1F8A5B]' : 'bg-[#D92D20]'}`} style={{ width: `${Math.min(100, data?.overallPercentage ?? 0)}%` }}/>
            </div>
          </div>
          <span className="text-[11px] text-[#4D4D4D]">
            {data?.attendedClasses ?? 0} attended out of {data?.totalClasses ?? 0} total sessions
          </span>
        </Card>

        {/* Safe Buffer Calculation */}
        <Card className="flex flex-col justify-between">
          <span className="text-xs font-medium text-[#888888]">University Buffer Margin</span>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${(data?.safeBuffer ?? 0) >= 0 ? 'text-[#1F8A5B]' : 'text-[#D92D20]'}`}>
                {data?.safeBuffer !== undefined && data.safeBuffer >= 0
            ? `+${data.safeBuffer}`
            : data?.safeBuffer ?? 0}
              </span>
              <span className="text-xs text-[#888888]">Classes Buffer</span>
            </div>
            <p className="text-xs text-[#4D4D4D] mt-2 leading-relaxed">
              {(data?.safeBuffer ?? 0) >= 0
            ? `You can safely miss ${data?.safeBuffer} classes without falling below 75%.`
            : `You are in condonation shortage! You must attend next ${Math.abs(data?.safeBuffer ?? 0)} classes.`}
            </p>
          </div>
          <Badge variant={(data?.safeBuffer ?? 0) >= 0 ? 'live' : 'error'}>
            {(data?.safeBuffer ?? 0) >= 0 ? 'Safe Standing' : 'Shortage Alert'}
          </Badge>
        </Card>

        {/* Semester Regulations */}
        <Card className="flex flex-col justify-between">
          <span className="text-xs font-medium text-[#888888]">VFSTR Academic Regulation</span>
          <div className="my-2 space-y-1.5 text-xs text-[#4D4D4D]">
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1F8A5B] shrink-0"/>
              <span>&ge; 75%: Eligible for End-Semester examinations</span>
            </p>
            <p className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0"/>
              <span>65% - 74%: Requires medical condonation fee</span>
            </p>
            <p className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#D92D20] shrink-0"/>
              <span>&lt; 65%: Detention in current semester</span>
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#888888]">Section 21 Automated Audit</span>
        </Card>
      </div>

      {/* Subject-wise Breakdown Table */}
      <Card className="space-y-4">
        <h2 className="text-sm font-semibold text-[#0D0D0D]">Subject-wise Attendance Breakdown</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E3E3E3] bg-[#F8F8FB] text-[#4D4D4D] font-mono">
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Attended</th>
                <th className="py-2.5 px-3">Total Held</th>
                <th className="py-2.5 px-3">Percentage</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E3E3]">
              {data?.subjectBreakdown && data.subjectBreakdown.length > 0 ? (data.subjectBreakdown.map((item) => {
            const isSafe = item.percentage >= 75;
            return (<tr key={item._id} className="hover:bg-[#F8F8FB] transition-colors">
                      <td className="py-3 px-3 font-semibold text-[#0D0D0D]">{item.subject}</td>
                      <td className="py-3 px-3 font-mono text-[#888888]">{item.subjectCode || '21CS3XX'}</td>
                      <td className="py-3 px-3 font-mono font-medium">{item.attendedClasses}</td>
                      <td className="py-3 px-3 font-mono text-[#888888]">{item.totalClasses}</td>
                      <td className="py-3 px-3 font-mono font-bold text-sm">
                        <span className={isSafe ? 'text-[#1F8A5B]' : 'text-[#D92D20]'}>
                          {item.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={isSafe ? 'live' : 'error'}>
                          {isSafe ? 'Eligible' : 'Shortage'}
                        </Badge>
                      </td>
                    </tr>);
        })) : (<tr>
                  <td colSpan={6} className="py-8 text-center text-[#888888]">
                    No subject attendance data available.
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Admin Update Attendance Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Update Student Attendance" description="Update held classes and attended count for a subject.">
        <form onSubmit={handleUpdateAttendance} className="space-y-4">
          <Input label="Student User ID or Roll Number" value={studentId} onChange={(e) => setStudentId(e.target.value)} required/>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#4D4D4D]">Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5]">
              {OFFICIAL_SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Total Classes Held" type="number" min="1" value={totalClasses} onChange={(e) => setTotalClasses(Number(e.target.value))} required/>
            <Input label="Classes Attended" type="number" min="0" value={attendedClasses} onChange={(e) => setAttendedClasses(Number(e.target.value))} required/>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              Save Attendance
            </Button>
          </div>
        </form>
      </Modal>
    </div>);
};
