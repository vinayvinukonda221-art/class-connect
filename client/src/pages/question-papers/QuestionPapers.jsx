import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, ExternalLink, CheckCircle2, Download } from 'lucide-react';
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

export const QuestionPapers = () => {
    const [searchParams] = useSearchParams();
    const initialExamType = searchParams.get('examType') || 'all';
    const { isAdmin } = useAuth();
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedExamType, setSelectedExamType] = useState(initialExamType);
    const [selectedSubject, setSelectedSubject] = useState('All');
    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [subject, setSubject] = useState(OFFICIAL_SUBJECTS[0]);
    const [examType, setExamType] = useState('FA-1');
    const [academicYear, setAcademicYear] = useState('2023-2024');
    const [paperFileObj, setPaperFileObj] = useState(null);
    const [fileName, setFileName] = useState('');
    const [hasSolution, setHasSolution] = useState(false);
    const [solutionFileObj, setSolutionFileObj] = useState(null);
    const [saving, setSaving] = useState(false);
    const fetchPapers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedSubject !== 'All')
                params.append('subject', selectedSubject);
            if (selectedExamType !== 'all')
                params.append('examType', selectedExamType);
            const res = await api.get(`/academic/question-papers?${params.toString()}`);
            if (res.data.success) {
                setPapers(res.data.papers || []);
            }
        }
        catch (err) {
            console.error('Error fetching question papers:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchPapers();
    }, [selectedSubject, selectedExamType]);
    const examTypes = ['all', 'FA-1', 'FA-2', 'FA-3', 'FA-4', 'Semester-End'];
    const subjects = SUBJECT_FILTER_OPTIONS;
    const handleUploadPaper = async (e) => {
        e.preventDefault();
        if (!paperFileObj) {
            alert('Please select a question paper file from your computer.');
            return;
        }
        try {
            setSaving(true);
            const uploadedPaper = await uploadFileToDriveAndServer(paperFileObj);
            let finalSolutionUrl = '';
            if (hasSolution && solutionFileObj) {
                const uploadedSolution = await uploadFileToDriveAndServer(solutionFileObj);
                finalSolutionUrl = uploadedSolution.fileUrl;
            }

            await api.post('/academic/question-papers', {
                subject,
                examType,
                academicYear,
                fileName: fileName.trim() || uploadedPaper.fileName || paperFileObj.name,
                fileUrl: uploadedPaper.fileUrl,
                driveFileId: uploadedPaper.driveFileId,
                fileSize: uploadedPaper.fileSize,
                mimeType: uploadedPaper.mimeType,
                solutionAvailable: hasSolution,
                solutionUrl: finalSolutionUrl,
            });
            setPaperFileObj(null);
            setFileName('');
            setHasSolution(false);
            setSolutionFileObj(null);
            setModalOpen(false);
            await fetchPapers();
        }
        catch (err) {
            alert('Failed to upload paper: ' + (err.response?.data?.message || err.message));
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E3E3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0D0D0D]">Question Papers</h1>
          <p className="text-xs text-[#4D4D4D] mt-0.5">
            Previous years university examination papers organized by FA-1, FA-2, FA-3, FA-4, and End Semesters
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)} size="sm" variant="primary">
          <Plus className="w-4 h-4 mr-1.5"/>
          <span>Archive Question Paper</span>
        </Button>
      </div>

      {/* Filter by Assessment Type (FA-1 to FA-4) */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2">
        {examTypes.map((type) => (<button key={type} onClick={() => setSelectedExamType(type)} className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${selectedExamType === type
                ? 'bg-[#0D0D0D] text-white'
                : 'bg-white border border-[#E3E3E3] text-[#4D4D4D] hover:bg-[#F8F8FB]'}`}>
            {type === 'all' ? 'All Assessments' : type}
          </button>))}
      </div>

      {/* Filter by Subject */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2">
        {subjects.map((subj) => (<button key={subj} onClick={() => setSelectedSubject(subj)} className={`px-2.5 py-1 rounded-sm text-[11px] font-medium transition-colors ${selectedSubject === subj
                ? 'bg-[#6C35F5] text-white font-semibold'
                : 'bg-[#F8F8FB] border border-[#E3E3E3] text-[#4D4D4D] hover:text-[#0D0D0D]'}`}>
            {subj}
          </button>))}
      </div>

      {/* Papers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (<div className="col-span-full py-12 text-center text-xs text-[#888888]">Loading question papers...</div>) : papers.length === 0 ? (<div className="col-span-full py-12 text-center text-xs text-[#888888] bg-white border border-[#E3E3E3] rounded-lg">
            No question papers found for the selected filter.
          </div>) : (papers.map((paper) => (<Card key={paper._id} className="flex flex-col justify-between space-y-3 hover:border-[#6C35F5]/30 transition-colors">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <Badge variant={paper.examType.startsWith('FA') ? 'purple' : 'deploying'}>
                    {paper.examType}
                  </Badge>
                  <span className="text-[11px] font-mono text-[#888888] bg-[#F8F8FB] px-1.5 py-0.5 rounded-sm">
                    AY {paper.academicYear}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#0D0D0D]">{paper.subject}</h3>
                  <p className="text-[11px] font-mono text-[#888888] mt-0.5">{paper.semester}</p>
                </div>

                {paper.solutionAvailable && (<div className="flex items-center gap-1 text-[11px] text-[#1F8A5B] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5"/>
                    <span>Solutions & Scheme Included</span>
                  </div>)}
              </div>

              <div className="pt-3 border-t border-[#E3E3E3] flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono text-[#888888] truncate max-w-[130px]">
                  {paper.fileName}
                </span>

                <div className="flex items-center gap-2">
                  {paper.fileUrl && (<a href={paper.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6C35F5] font-medium hover:underline flex items-center gap-1">
                      <span>Paper PDF</span>
                      <ExternalLink className="w-3 h-3"/>
                    </a>)}

                  {paper.solutionUrl && (<a href={paper.solutionUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1F8A5B] font-medium hover:underline flex items-center gap-1">
                      <span>Solution</span>
                      <ExternalLink className="w-3 h-3"/>
                    </a>)}
                </div>
              </div>
            </Card>)))}
      </div>

      {/* Archive Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Archive Question Paper" description="Upload a previous university examination paper directly from your computer.">
        <form onSubmit={handleUploadPaper} className="space-y-4">
          <FileUploadInput
            label="Select Question Paper PDF from Computer"
            selectedFile={paperFileObj}
            onFileSelect={(f) => {
              setPaperFileObj(f);
              if (f && !fileName) setFileName(f.name);
            }}
            accept=".pdf,.png,.jpg,.jpeg"
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#4D4D4D]">Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5]">
              {OFFICIAL_SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#4D4D4D]">Exam Assessment Type</label>
              <select value={examType} onChange={(e) => setExamType(e.target.value)} className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5]">
                <option value="FA-1">FA-1 (Formative Assessment 1)</option>
                <option value="FA-2">FA-2 (Formative Assessment 2)</option>
                <option value="FA-3">FA-3 (Formative Assessment 3)</option>
                <option value="FA-4">FA-4 (Formative Assessment 4)</option>
                <option value="Semester-End">Semester-End University Exam</option>
              </select>
            </div>

            <Input label="Academic Year" placeholder="e.g. 2023-2024" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} required/>
          </div>

          <Input label="Document Title / File Name" placeholder="e.g. CD_FA1_2023.pdf" value={fileName} onChange={(e) => setFileName(e.target.value)}/>

          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="solutionCheck" checked={hasSolution} onChange={(e) => setHasSolution(e.target.checked)} className="rounded-sm border-[#E3E3E3] text-[#6C35F5] focus:ring-[#6C35F5]"/>
            <label htmlFor="solutionCheck" className="text-xs text-[#0D0D0D] cursor-pointer">
              Answer key / solution scheme is available
            </label>
          </div>

          {hasSolution && (
            <FileUploadInput
              label="Select Solution File from Computer (Optional)"
              selectedFile={solutionFileObj}
              onFileSelect={(f) => setSolutionFileObj(f)}
              showDriveNotice={false}
            />
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E3E3E3]">
            <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving} disabled={!paperFileObj}>
              {saving ? 'Uploading...' : 'Archive Paper'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>);
};
