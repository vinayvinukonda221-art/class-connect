import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  FileText,
  Calendar,
  MessageSquare,
  ArrowRight,
  Upload,
  BookOpen,
  FolderGit2,
  FileQuestion,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { FileUploadInput } from '../../components/ui/FileUploadInput';
import { uploadFileToDriveAndServer } from '../../services/fileUploadService';

export const Dashboard = () => {
  const { user } = useAuth();
  const { messages } = useSocket();

  const [attendance, setAttendance] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [projects, setProjects] = useState([]);
  const [resources, setResources] = useState([]);
  const [questionPapers, setQuestionPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Source File Upload Modal state
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionFileObj, setSubmissionFileObj] = useState(null);
  const [submissionFileName, setSubmissionFileName] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [attRes, assignRes, timeRes, projRes, resRes, pyqRes] = await Promise.all([
          api.get('/academic/attendance').catch(() => ({ data: { attendance: null } })),
          api.get('/academic/assignments').catch(() => ({ data: { assignments: [] } })),
          api.get('/academic/timetable').catch(() => ({ data: { timetable: [] } })),
          api.get('/academic/projects').catch(() => ({ data: { projects: [] } })),
          api.get('/academic/resources').catch(() => ({ data: { resources: [] } })),
          api.get('/academic/question-papers').catch(() => ({ data: { papers: [] } })),
        ]);

        if (attRes.data?.attendance) setAttendance(attRes.data.attendance);
        if (assignRes.data?.assignments) setAssignments(assignRes.data.assignments);
        if (timeRes.data?.timetable) setTimetable(timeRes.data.timetable);
        if (projRes.data?.projects) setProjects(projRes.data.projects);
        if (resRes.data?.resources) setResources(resRes.data.resources);
        if (pyqRes.data?.papers) setQuestionPapers(pyqRes.data.papers);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Filter today's timetable based on current day
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];
  const currentDay = todayName === 'Sunday' ? 'Monday' : todayName;
  const todayClasses = timetable
    .filter((t) => t.day === currentDay)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  // Compute live ongoing class period dynamically
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const activeClass = todayClasses.find((c) => {
    if (!c.startTime || !c.endTime) return false;
    const [sh, sm] = c.startTime.split(':').map(Number);
    const [eh, em] = c.endTime.split(':').map(Number);
    const sMin = sh * 60 + sm;
    const eMin = eh * 60 + em;
    return currentMinutes >= sMin && currentMinutes <= eMin;
  });

  const handleOpenSubmit = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionFileObj(null);
    setSubmissionFileName('');
    setSubmissionNotes('');
    setSubmitSuccess(false);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    if (!submissionFileObj) {
      alert('Please select a file from your computer to upload.');
      return;
    }
    try {
      setSubmitting(true);
      const uploaded = await uploadFileToDriveAndServer(submissionFileObj);

      await api.post(`/academic/assignments/${selectedAssignment._id}/files`, {
        fileName: submissionFileName.trim() || uploaded.fileName || submissionFileObj.name,
        fileUrl: uploaded.fileUrl,
        downloadUrl: uploaded.downloadUrl,
        fileType: uploaded.fileType,
        driveFileId: uploaded.driveFileId,
        fileSize: uploaded.fileSize,
        mimeType: uploaded.mimeType,
        notes: submissionNotes.trim(),
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setSelectedAssignment(null);
        setSubmitSuccess(false);
      }, 1500);
      const res = await api.get('/academic/assignments');
      if (res.data?.assignments) setAssignments(res.data.assignments);
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const pendingAssignmentsCount = assignments.filter((a) => !a.userSubmission).length;

  return (
    <div className="space-y-6">
      {/* 1. HERO HEADER */}
      <section className="bg-white border border-[#E3E3E3] rounded-lg p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0D0D0D]">
              Welcome back, {user?.name || 'Student'} | CSE Section {user?.section || '21'} - VFSTR
            </h1>
            <p className="text-xs text-[#4D4D4D] mt-1">
              Department of Computer Science & Engineering · Vadlamudi Campus, Guntur
            </p>
          </div>
        </div>
      </section>

      {/* 2. KEY METRICS STATS ROW */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Attendance */}
        <Card className="flex flex-col justify-between hover:border-[#6C35F5]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#888888]">Overall Attendance</span>
            {attendance && attendance.totalClasses > 0 ? (
              <Badge variant={attendance.safeBuffer >= 0 ? 'live' : 'error'}>
                {attendance.safeBuffer >= 0 ? `+${attendance.safeBuffer} Buffer` : 'Shortage'}
              </Badge>
            ) : (
              <Badge variant="neutral">Not Recorded</Badge>
            )}
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#0D0D0D]">
                {attendance && attendance.totalClasses > 0 ? `${attendance.overallPercentage}%` : '0.0%'}
              </span>
              <span className="text-xs text-[#888888]">/ 75% Min.</span>
            </div>
            <div className="w-full bg-[#EEEEEE] rounded-full h-1.5 mt-2">
              <div
                className={`h-1.5 rounded-full ${
                  attendance && attendance.overallPercentage >= 75 ? 'bg-[#1F8A5B]' : 'bg-[#6C35F5]'
                }`}
                style={{ width: `${Math.min(100, attendance?.overallPercentage || 0)}%` }}
              />
            </div>
          </div>
          <span className="text-[11px] text-[#4D4D4D]">
            {attendance && attendance.totalClasses > 0
              ? `${attendance.attendedClasses} of ${attendance.totalClasses} classes attended`
              : 'Attendance records not yet posted'}
          </span>
        </Card>

        {/* Metric 2: Pending Assignments */}
        <Card className="flex flex-col justify-between hover:border-[#6C35F5]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#888888]">Pending Tasks</span>
            <Badge variant={pendingAssignmentsCount > 0 ? 'error' : 'neutral'}>
              {pendingAssignmentsCount > 0 ? 'Action Required' : 'All Clear'}
            </Badge>
          </div>
          <div className="my-2">
            <span className="text-3xl font-bold text-[#0D0D0D]">
              {pendingAssignmentsCount} Due
            </span>
            <p className="text-xs text-[#888888] mt-0.5">
              {pendingAssignmentsCount > 0 ? 'Assigned tasks pending submission' : 'No pending coursework'}
            </p>
          </div>
          <Link to="/assignments" className="text-[11px] text-[#6C35F5] hover:underline flex items-center gap-1">
            <span>View all assignments</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        {/* Metric 3: Active Projects & Labs */}
        <Card className="flex flex-col justify-between hover:border-[#6C35F5]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#888888]">Active Projects</span>
            <Badge variant={projects.length > 0 ? 'purple' : 'neutral'}>
              {projects.length > 0 ? 'Active' : 'None'}
            </Badge>
          </div>
          <div className="my-2">
            <span className="text-3xl font-bold text-[#0D0D0D]">{projects.length} Registered</span>
            <p className="text-xs text-[#888888] mt-0.5">
              {projects.length > 0 ? projects[0]?.title : 'No team projects registered'}
            </p>
          </div>
          <Link to="/projects" className="text-[11px] text-[#6C35F5] hover:underline flex items-center gap-1">
            <span>Track projects & teams</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        {/* Metric 4: Question Papers & Resources */}
        <Card className="flex flex-col justify-between hover:border-[#6C35F5]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#888888]">Question Bank</span>
            <Badge variant={questionPapers.length > 0 ? 'deploying' : 'neutral'}>
              {questionPapers.length > 0 ? 'Archive' : 'Empty'}
            </Badge>
          </div>
          <div className="my-2">
            <span className="text-3xl font-bold text-[#0D0D0D]">{questionPapers.length} Papers</span>
            <p className="text-xs text-[#888888] mt-0.5">
              {questionPapers.length > 0 ? 'Previous exam papers available' : 'No past papers archived yet'}
            </p>
          </div>
          <Link to="/question-papers" className="text-[11px] text-[#6C35F5] hover:underline flex items-center gap-1">
            <span>Explore question papers</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>
      </section>

      {/* 3. TODAY'S TIMETABLE SCHEDULE */}
      <section className="bg-white border border-[#E3E3E3] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#6C35F5]" />
            <h2 className="text-sm font-semibold text-[#0D0D0D]">Today's Timetable Schedule</h2>
            <span className="text-xs text-[#888888] ml-2 hidden sm:inline">
              {currentDay} · Section {user?.section || '21'}
            </span>
          </div>
          <Link to="/timetable" className="text-xs font-medium text-[#6C35F5] hover:underline flex items-center gap-1">
            <span>View Full Weekly Matrix</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Class Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {todayClasses.length > 0 ? (
            todayClasses.map((item, idx) => {
              const isLive = activeClass?.periodNumber === item.periodNumber;
              return (
                <div
                  key={item._id || idx}
                  className={`p-3 rounded-sm border flex flex-col justify-between transition-all ${
                    isLive
                      ? 'border-[#6C35F5] bg-[#FFFFFF] ring-1 ring-[#6C35F5]/30'
                      : 'border-[#E3E3E3] bg-[#FFFFFF]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-sans font-medium text-[#888888]">
                        {item.startTime} - {item.endTime}
                      </span>
                      {isLive && (
                        <span className="px-1.5 py-0.5 bg-[#6C35F5] text-white rounded-sm text-[10px] font-sans font-semibold uppercase tracking-wide">
                          Live Now
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-xs text-[#0D0D0D] line-clamp-1">{item.subject}</h3>
                    <p className="text-[11px] text-[#888888] mt-0.5 line-clamp-1">{item.facultyName}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#E3E3E3] flex items-center justify-between text-[11px] font-sans text-[#4D4D4D]">
                    <span>{item.roomNumber}</span>
                    <span className="text-[#6C35F5] font-medium">Period {item.periodNumber}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-[#888888] bg-[#F8F8FB] border border-[#E3E3E3] rounded-sm">
              No classes scheduled for today. Check the full weekly timetable matrix.
            </div>
          )}
        </div>
      </section>

      {/* 4. ACADEMIC ACTIVITY GRID (3 COLUMNS) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Assignments & Submissions */}
        <Card className="flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E3E3]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#6C35F5]" />
                <h3 className="text-sm font-semibold text-[#0D0D0D]">Recent Assignments</h3>
              </div>
              <Badge variant="purple">{assignments.length} Total</Badge>
            </div>

            <div className="mt-3 space-y-3">
              {assignments.length > 0 ? (
                assignments.slice(0, 3).map((assign) => (
                  <div
                    key={assign._id}
                    className="p-3 bg-[#F8F8FB] border border-[#E3E3E3] rounded-sm hover:border-[#6C35F5]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-sans text-[#D92D20] font-semibold">
                          Due: {new Date(assign.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                        <h4 className="text-xs font-semibold text-[#0D0D0D] mt-0.5">{assign.title}</h4>
                        <p className="text-[11px] text-[#888888] line-clamp-1 mt-0.5">{assign.subject}</p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleOpenSubmit(assign)}
                        className="w-full text-xs"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        <span>Upload Source File (PDF / PPT)</span>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[#888888] bg-[#F8F8FB] border border-[#E3E3E3] rounded-sm">
                  No assignments posted for Section 21 yet.
                </div>
              )}
            </div>
          </div>

          <Link
            to="/assignments"
            className="text-xs text-[#6C35F5] font-medium hover:underline text-center block pt-2 border-t border-[#E3E3E3]"
          >
            View All Assignments & Coursework &rarr;
          </Link>
        </Card>

        {/* Column 2: CR Broadcasts & Dept Notices */}
        <Card className="flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E3E3]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#6C35F5]" />
                <h3 className="text-sm font-semibold text-[#0D0D0D]">CR & Dept Notices</h3>
              </div>
              <Badge variant="live">Live Feed</Badge>
            </div>

            <div className="mt-3 space-y-3">
              {messages.length > 0 ? (
                messages.slice(-3).reverse().map((msg) => (
                  <div key={msg._id} className="p-3 bg-[#F8F8FB] border border-[#E3E3E3] rounded-sm space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-sans px-1.5 py-0.5 bg-[#F4F0FF] text-[#6C35F5] font-semibold rounded-sm">
                        {msg.senderRole === 'cr'
                          ? 'CR Broadcast'
                          : msg.senderRole === 'admin'
                          ? 'Dept Office'
                          : 'Student Notice'}
                      </span>
                      <span className="text-[10px] font-sans text-[#888888]">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-[#0D0D0D] leading-relaxed">{msg.message}</p>
                    <span className="text-[10px] text-[#888888] font-sans block">
                      Sent by: {msg.senderName} ({msg.senderRollNumber || 'S21'})
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[#888888] bg-[#F8F8FB] border border-[#E3E3E3] rounded-sm">
                  No active broadcasts. Announcements will appear here in real-time.
                </div>
              )}
            </div>
          </div>

          <Link
            to="/messages"
            className="text-xs text-[#6C35F5] font-medium hover:underline text-center block pt-2 border-t border-[#E3E3E3]"
          >
            Open Live Section Communication &rarr;
          </Link>
        </Card>

        {/* Column 3: Quick Resources & Question Bank */}
        <Card className="flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E3E3]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#6C35F5]" />
                <h3 className="text-sm font-semibold text-[#0D0D0D]">Resources & Question Papers</h3>
              </div>
              <Badge variant="neutral">Section Drive</Badge>
            </div>

            <div className="mt-3 space-y-3">
              {/* Subject PPTs / Notes */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#888888]">
                  Curriculum Slides & Notes
                </span>
                {resources.length > 0 ? (
                  resources.slice(0, 2).map((res) => (
                    <Link
                      key={res._id}
                      to={`/resources?subject=${encodeURIComponent(res.subject)}`}
                      className="flex items-center justify-between p-2 rounded-sm bg-[#F8F8FB] hover:bg-[#F4F0FF] transition-colors"
                    >
                      <span className="text-xs text-[#0D0D0D] font-medium truncate max-w-[200px]">
                        {res.title}
                      </span>
                      <span className="text-[10px] font-sans font-medium text-[#888888] uppercase">
                        {res.category || 'File'}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="p-2 text-center text-xs text-[#888888] bg-[#F8F8FB] border border-[#E3E3E3] rounded-sm">
                    No curriculum slides uploaded yet.
                  </div>
                )}
              </div>

              {/* Question Papers Archive */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#888888]">
                  Question Papers Archive
                </span>
                {questionPapers.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/question-papers?examType=FA-1"
                      className="p-2 border border-[#E3E3E3] rounded-sm bg-white hover:border-[#6C35F5] text-center transition-colors"
                    >
                      <span className="text-xs font-semibold block text-[#0D0D0D]">FA-1 Papers</span>
                      <span className="text-[10px] font-sans text-[#888888]">Recent</span>
                    </Link>
                    <Link
                      to="/question-papers?examType=FA-2"
                      className="p-2 border border-[#E3E3E3] rounded-sm bg-white hover:border-[#6C35F5] text-center transition-colors"
                    >
                      <span className="text-xs font-semibold block text-[#0D0D0D]">FA-2 Papers</span>
                      <span className="text-[10px] font-sans text-[#888888]">Recent</span>
                    </Link>
                  </div>
                ) : (
                  <div className="p-2 text-center text-xs text-[#888888] bg-[#F8F8FB] border border-[#E3E3E3] rounded-sm">
                    No question papers archived yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <Link
            to="/resources"
            className="text-xs text-[#6C35F5] font-medium hover:underline text-center block pt-2 border-t border-[#E3E3E3]"
          >
            Explore All Subject Materials &rarr;
          </Link>
        </Card>
      </section>

      {/* Assignment Source File Upload Modal */}
      <Modal
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        title={selectedAssignment ? `Upload Source File: ${selectedAssignment.title}` : 'Upload Source File'}
        description={`Subject: ${selectedAssignment?.subject} · Upload question PDFs, presentation slides, or solution files from your computer.`}
        maxWidth="lg"
      >
        {submitSuccess ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-[#1F8A5B] mx-auto" />
            <h4 className="text-sm font-semibold text-[#0D0D0D]">Source File Uploaded!</h4>
            <p className="text-xs text-[#888888]">Saved to your linked Google Drive and available for all section members to download.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitAssignment} className="space-y-4">
            <FileUploadInput
              label="Select Document / Source File from Computer"
              selectedFile={submissionFileObj}
              onFileSelect={(f) => {
                setSubmissionFileObj(f);
                if (f && !submissionFileName) setSubmissionFileName(f.name);
              }}
              required
            />

            <Input
              label="File Name / Document Title"
              placeholder="e.g. Unit_2_Questions.pdf or Assignment_Solution.pptx"
              value={submissionFileName}
              onChange={(e) => setSubmissionFileName(e.target.value)}
              helperText="Title visible to all students in Section 21."
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#4D4D4D]">Description / Notes (Optional)</label>
              <textarea
                className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm placeholder:text-[#888888] focus:outline-none focus:border-[#6C35F5] focus:ring-1 focus:ring-[#6C35F5] min-h-[80px]"
                placeholder="Mention questions covered, notes, or implementation details..."
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E3E3E3]">
              <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedAssignment(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={submitting} disabled={!submissionFileObj}>
                {submitting ? 'Uploading File...' : 'Upload & Share File'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
