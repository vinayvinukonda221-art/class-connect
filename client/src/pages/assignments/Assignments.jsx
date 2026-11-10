import React, { useState, useEffect } from 'react';
import {
  Upload,
  Calendar,
  ExternalLink,
  Plus,
  FileText,
  Download,
  Presentation,
  FolderOpen,
  User,
  Share2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { uploadFileToDriveAndServer } from '../../services/fileUploadService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { FileUploadInput } from '../../components/ui/FileUploadInput';
import { OFFICIAL_SUBJECTS, SUBJECT_FILTER_OPTIONS } from '../../constants/subjects';

export const Assignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('All');

  // Upload Source File Modal
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [uploadFileObj, setUploadFileObj] = useState(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  // Add Assignment Modal (Available to all students & admins)
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubject, setNewSubject] = useState(OFFICIAL_SUBJECTS[0]);
  const [newDueDate, setNewDueDate] = useState('');
  const [newMaxMarks, setNewMaxMarks] = useState(25);
  const [initialFileObj, setInitialFileObj] = useState(null);
  const [initialFileName, setInitialFileName] = useState('');
  const [initialFileNotes, setInitialFileNotes] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academic/assignments');
      if (res.data.success) {
        setAssignments(res.data.assignments || []);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const subjects = SUBJECT_FILTER_OPTIONS;
  const filtered =
    selectedSubject === 'All'
      ? assignments
      : assignments.filter((a) => a.subject === selectedSubject);

  const handleUploadSourceFile = async (e) => {
    e.preventDefault();
    if (!activeAssignment) return;
    if (!uploadFileObj) {
      alert('Please select a file from your computer to upload.');
      return;
    }

    try {
      setUploading(true);

      // 1. Upload file directly from computer to Drive & server storage
      const uploaded = await uploadFileToDriveAndServer(uploadFileObj);

      const cleanName =
        uploadFileName.trim() ||
        uploaded.fileName ||
        uploadFileObj.name;

      // 2. Attach uploaded file to the assignment
      await api.post(`/academic/assignments/${activeAssignment._id}/files`, {
        fileName: cleanName,
        fileUrl: uploaded.fileUrl,
        downloadUrl: uploaded.downloadUrl,
        fileType: uploaded.fileType,
        driveFileId: uploaded.driveFileId,
        fileSize: uploaded.fileSize,
        mimeType: uploaded.mimeType,
        notes: uploadNotes.trim(),
      });

      await fetchAssignments();
      setActiveAssignment(null);
      setUploadFileObj(null);
      setUploadFileName('');
      setUploadNotes('');
    } catch (err) {
      alert('Failed to upload source file: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);

      let initialFilePayload = null;

      // If initial file selected from computer, upload it first
      if (initialFileObj) {
        const uploaded = await uploadFileToDriveAndServer(initialFileObj);
        initialFilePayload = {
          fileName: initialFileName.trim() || uploaded.fileName || initialFileObj.name,
          fileUrl: uploaded.fileUrl,
          downloadUrl: uploaded.downloadUrl,
          fileType: uploaded.fileType,
          driveFileId: uploaded.driveFileId,
          fileSize: uploaded.fileSize,
          mimeType: uploaded.mimeType,
          notes: initialFileNotes.trim(),
        };
      }

      const payload = {
        title: newTitle.trim(),
        description: newDesc.trim(),
        subject: newSubject,
        dueDate: newDueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxMarks: Number(newMaxMarks) || 25,
      };

      if (initialFilePayload) {
        payload.initialFile = initialFilePayload;
      }

      await api.post('/academic/assignments', payload);
      setNewTitle('');
      setNewDesc('');
      setNewDueDate('');
      setInitialFileObj(null);
      setInitialFileName('');
      setInitialFileNotes('');
      setCreateModalOpen(false);
      await fetchAssignments();
    } catch (err) {
      alert('Failed to post assignment: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreating(false);
    }
  };

  // Helper to gather all downloadable source files for an assignment
  const getAllFiles = (item) => {
    const list = [];
    const seenUrls = new Set();

    // 1. Direct attachments
    if (Array.isArray(item.attachments)) {
      item.attachments.forEach((att) => {
        if (att.fileUrl && !seenUrls.has(att.fileUrl)) {
          seenUrls.add(att.fileUrl);
          list.push({
            id: att._id || att.fileUrl,
            fileName: att.fileName || 'Source Document',
            fileUrl: att.fileUrl,
            fileType:
              att.fileType ||
              (att.fileUrl.toLowerCase().includes('.ppt')
                ? 'ppt'
                : att.fileUrl.toLowerCase().includes('.pdf')
                  ? 'pdf'
                  : 'drive'),
            notes: att.notes || '',
            uploaderName:
              att.uploaderName || item.creatorName || item.createdBy?.name || 'Section 21 Member',
            uploaderRollNumber:
              att.uploaderRollNumber || item.creatorRollNumber || item.createdBy?.rollNumber || '',
            uploadedAt: att.uploadedAt || item.createdAt,
          });
        }
      });
    }

    // 2. Student uploaded files / submissions
    if (Array.isArray(item.submissions)) {
      item.submissions.forEach((sub) => {
        const url = sub.fileUrl || sub.externalLink;
        if (url && !seenUrls.has(url)) {
          seenUrls.add(url);
          list.push({
            id: sub._id || url,
            fileName: sub.fileName || `${sub.student?.name || 'Student'}_SourceFile.pdf`,
            fileUrl: url,
            fileType:
              url.toLowerCase().includes('.ppt') || url.toLowerCase().includes('.pptx')
                ? 'ppt'
                : url.toLowerCase().includes('.pdf')
                  ? 'pdf'
                  : 'drive',
            notes: sub.notes || '',
            uploaderName: sub.student?.name || 'Section 21 Student',
            uploaderRollNumber: sub.student?.rollNumber || '',
            uploadedAt: sub.submissionDate || sub.createdAt,
          });
        }
      });
    }

    return list;
  };

  const getFileTypeBadge = (type) => {
    switch (type) {
      case 'ppt':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase font-mono">
            <Presentation className="w-3 h-3 text-amber-600" />
            PPT
          </span>
        );
      case 'drive':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F4F0FF] text-[#6C35F5] border border-purple-200 uppercase font-mono">
            <FolderOpen className="w-3 h-3 text-[#6C35F5]" />
            Drive
          </span>
        );
      case 'pdf':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase font-mono">
            <FileText className="w-3 h-3 text-rose-600" />
            PDF
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E3E3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0D0D0D]">
            Assignments & Coursework
          </h1>
          <p className="text-xs text-[#4D4D4D] mt-0.5">
            Share and download assignment source files, question PDFs, PPTs, and solution materials for Section 21
          </p>
        </div>

        {/* Available to all students & admins */}
        <Button onClick={() => setCreateModalOpen(true)} size="sm" variant="primary">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add Assignment</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2">
        {subjects.map((subj) => (
          <button
            key={subj}
            onClick={() => setSelectedSubject(subj)}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${selectedSubject === subj
                ? 'bg-[#0D0D0D] text-white'
                : 'bg-white border border-[#E3E3E3] text-[#4D4D4D] hover:text-[#0D0D0D] hover:bg-[#F8F8FB]'
              }`}
          >
            {subj}
          </button>
        ))}
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-[#888888]">
            Loading assignments and materials...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-[#888888] bg-white border border-[#E3E3E3] rounded-lg">
            No assignments found for the selected subject filter. Click "+ Add Assignment" to post one!
          </div>
        ) : (
          filtered.map((item) => {
            const files = getAllFiles(item);
            const isLate = new Date() > new Date(item.dueDate);

            return (
              <Card
                key={item._id}
                className="flex flex-col justify-between space-y-4 hover:border-[#6C35F5]/30 transition-colors bg-white border border-[#E3E3E3] rounded-sm p-4 sm:p-5"
              >
                {/* Top Details */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-[#6C35F5] border border-purple-200">
                      {item.subject}
                    </span>
                    <Badge variant={isLate ? 'error' : 'live'}>
                      {isLate ? 'Past Deadline' : 'Active Coursework'}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#0D0D0D] leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#4D4D4D] mt-1.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Metadata line */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#888888] pt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#6C35F5]" />
                      <span>
                        Posted by:{' '}
                        <strong className="text-[#0D0D0D]">
                          {item.creatorName || item.createdBy?.name || 'Section 21 Member'}
                        </strong>{' '}
                        {item.creatorRollNumber || item.createdBy?.rollNumber ? (
                          <span className="font-mono">({item.creatorRollNumber || item.createdBy?.rollNumber})</span>
                        ) : null}
                      </span>
                    </span>

                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-[#888888]" />
                      <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                {/* Shared Source Files & Materials Section */}
                <div className="pt-3 border-t border-[#E3E3E3] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-[#6C35F5]" />
                      <span className="text-xs font-semibold text-[#0D0D0D]">
                        Source Files & Materials
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-[#888888]">
                      {files.length} {files.length === 1 ? 'file' : 'files'} available
                    </span>
                  </div>

                  {/* Files List */}
                  {files.length === 0 ? (
                    <div className="p-3 bg-[#F8F8FB] border border-[#E3E3E3] rounded-sm text-center text-xs text-[#888888]">
                      No source files attached yet. Click below to share a question PDF or solution PPT!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {files.map((file, idx) => (
                        <div
                          key={file.id || idx}
                          className="p-2.5 bg-[#F8F8FB] border border-[#E3E3E3] rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F3F1FA] transition-colors"
                        >
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {getFileTypeBadge(file.fileType)}
                              <span className="text-xs font-semibold text-[#0D0D0D] truncate">
                                {file.fileName}
                              </span>
                            </div>

                            <p className="text-[11px] text-[#888888]">
                              Shared by <span className="text-[#4D4D4D] font-medium">{file.uploaderName}</span>{' '}
                              {file.uploaderRollNumber ? (
                                <span className="font-mono">({file.uploaderRollNumber})</span>
                              ) : null}{' '}
                              · {new Date(file.uploadedAt).toLocaleDateString()}
                            </p>

                            {file.notes && (
                              <p className="text-[11px] text-[#4D4D4D] italic truncate">
                                "{file.notes}"
                              </p>
                            )}
                          </div>

                          {/* Direct Download / Open Button */}
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#6C35F5] bg-white hover:bg-[#F4F0FF] rounded-sm border border-purple-200 shadow-xs transition-colors shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download / Open</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Action Button for Students */}
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setActiveAssignment(item);
                      setUploadFileObj(null);
                      setUploadFileName('');
                      setUploadNotes('');
                    }}
                    className="w-full justify-center"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    <span>Upload Source File (PDF / PPT)</span>
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Upload Source File Modal */}
      <Modal
        isOpen={!!activeAssignment}
        onClose={() => setActiveAssignment(null)}
        title={activeAssignment ? `Upload Source File: ${activeAssignment.title}` : 'Upload Source File'}
        description="Select question PDFs, presentation slides (PPTs), or solution documents from your computer to share with Section 21."
        maxWidth="lg"
      >
        <form onSubmit={handleUploadSourceFile} className="space-y-4">
          <FileUploadInput
            label="Select Document / Source File from Computer"
            selectedFile={uploadFileObj}
            onFileSelect={(file) => {
              setUploadFileObj(file);
              if (file && !uploadFileName) {
                setUploadFileName(file.name);
              }
            }}
            required
          />

          <Input
            label="File Name / Document Title"
            placeholder="e.g. OT_Unit_2_Questions.pdf or Decision_Trees_Solution.pptx"
            value={uploadFileName}
            onChange={(e) => setUploadFileName(e.target.value)}
            required
            helperText="Clear title indicating what is inside this document."
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#4D4D4D]">Description / Notes (Optional)</label>
            <textarea
              className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm placeholder:text-[#888888] focus:outline-none focus:border-[#6C35F5] focus:ring-1 focus:ring-[#6C35F5] min-h-[75px]"
              placeholder="e.g. Question paper from today's lecture, or solution steps for questions 1 to 5..."
              value={uploadNotes}
              onChange={(e) => setUploadNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E3E3E3]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setActiveAssignment(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={uploading}
              disabled={!uploadFileObj}
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              <span>{uploading ? 'Uploading File...' : 'Upload & Share File'}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Assignment Modal (Available to All Students & Admins) */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Assignment"
        description="Post coursework, problem statements, and initial source materials for Section 21."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <Input
            label="Assignment Title"
            placeholder="e.g. OT Assignment 2 — Dual Simplex Method"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#4D4D4D]">Subject</label>
            <select
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5]"
            >
              {OFFICIAL_SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#4D4D4D]">
              Description & Problem Statement
            </label>
            <textarea
              className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5] min-h-[90px]"
              placeholder="State requirements, questions to solve, or problem guidelines..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Due Date & Time"
              type="datetime-local"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
            <Input
              label="Max Marks"
              type="number"
              value={newMaxMarks}
              onChange={(e) => setNewMaxMarks(Number(e.target.value))}
            />
          </div>

          {/* Initial Source File Attachment (Optional) */}
          <div className="p-3 bg-[#F8F8FB] border border-[#E3E3E3] rounded-sm space-y-3">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-[#0D0D0D]">
              <FileText className="w-3.5 h-3.5 text-[#6C35F5]" />
              <span>Attach Initial Source File (Optional)</span>
            </div>

            <FileUploadInput
              label="Select File from Computer"
              selectedFile={initialFileObj}
              onFileSelect={(file) => {
                setInitialFileObj(file);
                if (file && !initialFileName) {
                  setInitialFileName(file.name);
                }
              }}
              showDriveNotice={false}
            />

            {initialFileObj && (
              <Input
                label="File Display Title"
                placeholder="e.g. Questions_Sheet.pdf"
                value={initialFileName}
                onChange={(e) => setInitialFileName(e.target.value)}
              />
            )}

            <Input
              label="File Notes / Instructions"
              placeholder="e.g. Question paper provided by professor"
              value={initialFileNotes}
              onChange={(e) => setInitialFileNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E3E3E3]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={creating}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              <span>{creating ? 'Posting Assignment...' : 'Post Assignment'}</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
