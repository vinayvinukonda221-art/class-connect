import React, { useState, useEffect } from 'react';
import { FileText, ExternalLink, Plus, Copy, Check, Download } from 'lucide-react';
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

export const LabRecords = () => {
    const { isAdmin } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState('All');
    const [copiedCodeId, setCopiedCodeId] = useState(null);
    // Admin add experiment modal
    const [modalOpen, setModalOpen] = useState(false);
    const [subject, setSubject] = useState(OFFICIAL_SUBJECTS[0]);
    const [expNumber, setExpNumber] = useState(1);
    const [expName, setExpName] = useState('');
    const [aim, setAim] = useState('');
    const [sampleCode, setSampleCode] = useState('');
    const [manualFileObj, setManualFileObj] = useState(null);
    const [saving, setSaving] = useState(false);
    const fetchRecords = async () => {
        try {
            setLoading(true);
            const res = await api.get('/academic/lab-records');
            if (res.data.success) {
                setRecords(res.data.records || []);
            }
        }
        catch (err) {
            console.error('Error fetching lab records:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchRecords();
    }, []);
    const subjects = SUBJECT_FILTER_OPTIONS;
    const filtered = selectedSubject === 'All'
        ? records
        : records.filter((r) => r.subject === selectedSubject);
    const handleCopyCode = (id, code) => {
        navigator.clipboard.writeText(code);
        setCopiedCodeId(id);
        setTimeout(() => setCopiedCodeId(null), 2000);
    };
    const handleCreateRecord = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            let finalManualUrl = '';
            if (manualFileObj) {
                const uploaded = await uploadFileToDriveAndServer(manualFileObj);
                finalManualUrl = uploaded.fileUrl;
            }

            await api.post('/academic/lab-records', {
                subject,
                experimentNumber: Number(expNumber),
                experimentName: expName,
                aim,
                sampleCode,
                labManualUrl: finalManualUrl,
            });
            setExpName('');
            setAim('');
            setSampleCode('');
            setManualFileObj(null);
            setModalOpen(false);
            await fetchRecords();
        }
        catch (err) {
            alert('Failed to add experiment: ' + err.message);
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E3E3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0D0D0D]">Lab Records & Manuals</h1>
          <p className="text-xs text-[#4D4D4D] mt-0.5">
            Subject-wise experiment index, observation aims, sample algorithms, and manual downloads
          </p>
        </div>

        {isAdmin && (<Button onClick={() => setModalOpen(true)} size="sm" variant="primary">
            <Plus className="w-4 h-4 mr-1.5"/>
            <span>Add Experiment</span>
          </Button>)}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2">
        {subjects.map((subj) => (<button key={subj} onClick={() => setSelectedSubject(subj)} className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${selectedSubject === subj
                ? 'bg-[#0D0D0D] text-white'
                : 'bg-white border border-[#E3E3E3] text-[#4D4D4D] hover:text-[#0D0D0D] hover:bg-[#F8F8FB]'}`}>
            {subj}
          </button>))}
      </div>

      {/* Experiments List */}
      <div className="space-y-4">
        {loading ? (<div className="py-12 text-center text-xs text-[#888888]">Loading lab records...</div>) : filtered.length === 0 ? (<div className="py-12 text-center text-xs text-[#888888] bg-white border border-[#E3E3E3] rounded-lg">
            No lab experiments listed for this subject yet.
          </div>) : (filtered.map((item) => (<Card key={item._id} className="space-y-3 hover:border-[#6C35F5]/30 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="purple">Experiment #{item.experimentNumber}</Badge>
                  <span className="text-xs font-semibold text-[#6C35F5]">{item.subject}</span>
                </div>

                {item.labManualUrl && (<a href={item.labManualUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0D0D0D] hover:text-[#6C35F5] flex items-center gap-1 font-medium">
                    <FileText className="w-3.5 h-3.5 text-[#6C35F5]"/>
                    <span>Download Manual PDF</span>
                    <ExternalLink className="w-3 h-3"/>
                  </a>)}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#0D0D0D]">{item.experimentName}</h3>
                {item.aim && (<p className="text-xs text-[#4D4D4D] mt-1">
                    <span className="font-semibold text-[#0D0D0D]">Aim:</span> {item.aim}
                  </p>)}
              </div>

              {item.sampleCode && (<div className="pt-2">
                  <div className="flex items-center justify-between pb-1 text-[11px] font-mono text-[#888888]">
                    <span>Sample Algorithm / Source Code</span>
                    <button onClick={() => handleCopyCode(item._id, item.sampleCode)} className="flex items-center gap-1 text-[#6C35F5] hover:underline">
                      {copiedCodeId === item._id ? (<>
                          <Check className="w-3 h-3"/>
                          <span>Copied!</span>
                        </>) : (<>
                          <Copy className="w-3 h-3"/>
                          <span>Copy snippet</span>
                        </>)}
                    </button>
                  </div>
                  <pre className="p-3 bg-[#121212] text-[#F8F8FB] font-mono text-xs rounded-sm overflow-x-auto">
                    <code>{item.sampleCode}</code>
                  </pre>
                </div>)}
            </Card>)))}
      </div>

      {/* Admin Add Experiment Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Lab Experiment" description="Define an experiment in the section lab syllabus.">
        <form onSubmit={handleCreateRecord} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#4D4D4D]">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5]">
                {OFFICIAL_SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <Input label="Experiment Number" type="number" min="1" value={expNumber} onChange={(e) => setExpNumber(Number(e.target.value))} required/>
          </div>

          <Input label="Experiment Title" placeholder="e.g. Construction of DFA for Identifiers" value={expName} onChange={(e) => setExpName(e.target.value)} required/>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#4D4D4D]">Aim / Objective</label>
            <textarea className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5] min-h-[70px]" placeholder="State experiment objective..." value={aim} onChange={(e) => setAim(e.target.value)}/>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#4D4D4D]">Sample Code / Lex Specification</label>
            <textarea className="w-full bg-[#121212] text-[#F8F8FB] font-mono text-xs rounded-sm p-3 focus:outline-none min-h-[120px]" placeholder="Paste starter code or syntax..." value={sampleCode} onChange={(e) => setSampleCode(e.target.value)}/>
          </div>

          <FileUploadInput
            label="Upload Lab Manual / Specification PDF (Optional)"
            selectedFile={manualFileObj}
            onFileSelect={(f) => setManualFileObj(f)}
            accept=".pdf,.doc,.docx"
            showDriveNotice={false}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E3E3E3]">
            <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              {saving ? 'Saving...' : 'Save Experiment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>);
};
