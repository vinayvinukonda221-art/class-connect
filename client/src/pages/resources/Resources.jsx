import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, ExternalLink, BookOpen, FlaskConical, Download } from 'lucide-react';
import { api } from '../../services/api';
import { uploadFileToDriveAndServer } from '../../services/fileUploadService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { FileUploadInput } from '../../components/ui/FileUploadInput';
import { OFFICIAL_SUBJECTS, SUBJECT_FILTER_OPTIONS } from '../../constants/subjects';

export const Resources = () => {
    const [searchParams] = useSearchParams();
    const initialSubject = searchParams.get('subject') || 'All';
    const initialSearch = searchParams.get('search') || '';
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState(initialSubject);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    // Upload/share resource modal
    const [modalOpen, setModalOpen] = useState(false);
    const [fileObj, setFileObj] = useState(null);
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState(OFFICIAL_SUBJECTS[0]);
    const [category, setCategory] = useState('lecture');
    const [unit, setUnit] = useState('Unit 1');
    const [fileName, setFileName] = useState('');
    const [tags, setTags] = useState('');
    const [saving, setSaving] = useState(false);
    const fetchResources = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedSubject !== 'All')
                params.append('subject', selectedSubject);
            if (selectedCategory !== 'all')
                params.append('category', selectedCategory);
            if (searchQuery.trim())
                params.append('search', searchQuery.trim());
            const res = await api.get(`/academic/resources?${params.toString()}`);
            if (res.data.success) {
                setResources(res.data.resources || []);
            }
        }
        catch (err) {
            console.error('Error fetching resources:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchResources();
    }, [selectedSubject, selectedCategory]);
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchResources();
    };
    const subjects = SUBJECT_FILTER_OPTIONS;
    const handleShareResource = async (e) => {
        e.preventDefault();
        if (!fileObj) {
            alert('Please select a file from your computer.');
            return;
        }
        try {
            setSaving(true);
            const uploaded = await uploadFileToDriveAndServer(fileObj);

            await api.post('/academic/resources', {
                title,
                subject,
                category,
                unit,
                fileName: fileName.trim() || uploaded.fileName || fileObj.name,
                fileUrl: uploaded.fileUrl,
                driveFileId: uploaded.driveFileId,
                fileSize: uploaded.fileSize,
                mimeType: uploaded.mimeType,
                tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            });
            setTitle('');
            setFileName('');
            setFileObj(null);
            setTags('');
            setModalOpen(false);
            await fetchResources();
        }
        catch (err) {
            alert('Failed to share resource: ' + (err.response?.data?.message || err.message));
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E3E3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0D0D0D]">Subject Academic Resources</h1>
          <p className="text-xs text-[#4D4D4D] mt-0.5">
            Organized course lecture slides, laboratory manuals, textbook references, and Drive links
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)} size="sm" variant="primary">
          <Plus className="w-4 h-4 mr-1.5"/>
          <span>Upload / Share Resource</span>
        </Button>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setSelectedCategory('all')} className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${selectedCategory === 'all'
            ? 'bg-[#0D0D0D] text-white'
            : 'bg-white border border-[#E3E3E3] text-[#4D4D4D] hover:bg-[#F8F8FB]'}`}>
            All Resources
          </button>
          <button onClick={() => setSelectedCategory('lecture')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${selectedCategory === 'lecture'
            ? 'bg-[#0D0D0D] text-white'
            : 'bg-white border border-[#E3E3E3] text-[#4D4D4D] hover:bg-[#F8F8FB]'}`}>
            <BookOpen className="w-3.5 h-3.5"/>
            <span>Lecture Notes & PPTs</span>
          </button>
          <button onClick={() => setSelectedCategory('lab')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${selectedCategory === 'lab'
            ? 'bg-[#0D0D0D] text-white'
            : 'bg-white border border-[#E3E3E3] text-[#4D4D4D] hover:bg-[#F8F8FB]'}`}>
            <FlaskConical className="w-3.5 h-3.5"/>
            <span>Lab Manuals & Code</span>
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
          <Input placeholder="Search keywords, unit, topic..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
          <Button type="submit" size="sm" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2">
        {subjects.map((subj) => (<button key={subj} onClick={() => setSelectedSubject(subj)} className={`px-2.5 py-1 rounded-sm text-[11px] font-medium transition-colors ${selectedSubject === subj
                ? 'bg-[#6C35F5] text-white font-semibold'
                : 'bg-[#F8F8FB] border border-[#E3E3E3] text-[#4D4D4D] hover:text-[#0D0D0D]'}`}>
            {subj}
          </button>))}
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (<div className="col-span-full py-12 text-center text-xs text-[#888888]">Loading resources...</div>) : resources.length === 0 ? (<div className="col-span-full py-12 text-center text-xs text-[#888888] bg-white border border-[#E3E3E3] rounded-lg">
            No resources found matching the selected filter.
          </div>) : (resources.map((item) => (<Card key={item._id} className="flex flex-col justify-between space-y-3 hover:border-[#6C35F5]/30 transition-colors">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <Badge variant={item.category === 'lecture' ? 'purple' : 'deploying'}>
                    {item.category === 'lecture' ? 'Lecture Material' : 'Lab Manual'}
                  </Badge>
                  {item.unit && (<span className="text-[10px] font-mono font-medium text-[#888888] bg-[#F8F8FB] px-1.5 py-0.5 rounded-sm">
                      {item.unit}
                    </span>)}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#0D0D0D] line-clamp-2 leading-snug">{item.title}</h3>
                  <span className="text-xs text-[#6C35F5] font-medium block mt-0.5">{item.subject}</span>
                  {item.description && (<p className="text-xs text-[#4D4D4D] mt-1 line-clamp-2">{item.description}</p>)}
                </div>

                {item.tags?.length > 0 && (<div className="flex flex-wrap gap-1 pt-1">
                    {item.tags.map((t, i) => (<span key={i} className="text-[10px] font-mono text-[#888888] bg-[#F8F8FB] px-1.5 py-0.5 rounded-sm">
                        #{t}
                      </span>))}
                  </div>)}
              </div>

              <div className="pt-3 border-t border-[#E3E3E3] flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono text-[#888888] truncate max-w-[140px]">
                  {item.fileName}
                </span>

                {item.fileUrl || item.driveFileId ? (<a href={item.fileUrl || `https://drive.google.com/file/d/${item.driveFileId}/view`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6C35F5] font-medium hover:underline flex items-center gap-1">
                    <span>Download / Open</span>
                    <ExternalLink className="w-3 h-3"/>
                  </a>) : (<span className="text-[11px] text-[#888888]">Direct PDF</span>)}
              </div>
            </Card>)))}
      </div>

      {/* Share Resource Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Share Course Resource" description="Upload notes, PPT slides, or lab manuals directly from your computer to Section 21 repository.">
        <form onSubmit={handleShareResource} className="space-y-4">
          <FileUploadInput
            label="Select Course Document / Slide from Computer"
            selectedFile={fileObj}
            onFileSelect={(f) => {
              setFileObj(f);
              if (f && !fileName) setFileName(f.name);
              if (f && !title) setTitle(f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
            }}
            required
          />

          <Input label="Resource Title" placeholder="e.g. Unit 3 LR Parsing Table Construction Guide" value={title} onChange={(e) => setTitle(e.target.value)} required/>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#4D4D4D]">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5]">
                {OFFICIAL_SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#4D4D4D]">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5]">
                <option value="lecture">Lecture Notes / PPT</option>
                <option value="lab">Lab Manual / Code</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Curriculum Unit / Module" placeholder="e.g. Unit 2 or Lab 3" value={unit} onChange={(e) => setUnit(e.target.value)}/>
            <Input label="File Name" placeholder="e.g. CD_Unit2_Notes.pdf" value={fileName} onChange={(e) => setFileName(e.target.value)}/>
          </div>

          <Input label="Tags (Comma separated)" placeholder="e.g. Slides, Grammar, Parsing" value={tags} onChange={(e) => setTags(e.target.value)}/>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E3E3E3]">
            <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving} disabled={!fileObj}>
              {saving ? 'Uploading...' : 'Share Resource'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>);
};
