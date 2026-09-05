import { useState, useRef } from 'react';
import { UploadCloud, FileText } from 'lucide-react';
import axios from 'axios';
import { auth } from '../../firebase/firebase';
import { toast } from 'react-hot-toast';

const BatchImageIssueModal = ({ onClose, defaultDomain = '' }) => {
  const [domainScope, setDomainScope] = useState('internal');
  const [imageFiles, setImageFiles] = useState([]);
  const [schoolDomain, setSchoolDomain] = useState(defaultDomain || 'yourdomain.edu');
  const [targetEmail, setTargetEmail] = useState('');
  const [issuing, setIssuing] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/') || file.type === 'application/pdf');
      setImageFiles(prev => [...prev, ...files]);
    }
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleBatchIssue = async (e) => {
    e.preventDefault();
    if (imageFiles.length === 0) return toast.error("Please select at least one certificate file.");
    if (domainScope === 'internal' && !schoolDomain) return toast.error("School domain is required.");
    if (domainScope === 'external' && !targetEmail) return toast.error("Target email is required.");
    
    setIssuing(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const formDataUpload = new FormData();
      
      formDataUpload.append('domainScope', domainScope);
      if (domainScope === 'internal') formDataUpload.append('schoolDomain', schoolDomain);
      if (domainScope === 'external') formDataUpload.append('targetEmail', targetEmail);

      imageFiles.forEach(file => {
        formDataUpload.append('certificates', file);
      });

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/institution/batch-issue`, formDataUpload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(res.data.message || `Successfully issued ${imageFiles.length} credentials!`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to process batch issuance.");
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/50">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-full max-w-lg p-8 rounded-3xl shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          ✕
        </button>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-6">
          <UploadCloud className="text-brand-500 w-6 h-6" /> Send Certificates
        </h3>
        
        <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mb-6 p-1">
          <button 
            onClick={() => setDomainScope('internal')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${domainScope === 'internal' ? 'bg-brand-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            My Students
          </button>
          <button 
            onClick={() => setDomainScope('external')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${domainScope === 'external' ? 'bg-brand-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Other Schools
          </button>
        </div>

        <div className="mb-6">
          {domainScope === 'internal' ? (
            <>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">School Website Address (Domain)</label>
              <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500">
                <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm font-medium border-r border-slate-200 dark:border-slate-800">
                  [filename]@
                </div>
                <input 
                  type="text" 
                  className="flex-1 bg-transparent px-4 py-3 text-slate-900 dark:text-white text-sm outline-none"
                  value={schoolDomain}
                  onChange={(e) => setSchoolDomain(e.target.value)}
                  placeholder="certihub.in"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                The system will automatically extract the filename as the roll number (e.g. <strong>1234.pdf</strong> converts to <strong>1234@{schoolDomain || 'certihub.in'}</strong>).
              </p>
            </>
          ) : (
            <>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Student's Email Address</label>
              <input 
                type="email" 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-brand-500"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="student@otherdomain.com"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Manual email entry for students outside your institution domain.
              </p>
            </>
          )}
        </div>

        <div 
          className="border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 text-center cursor-pointer hover:border-brand-500/50 transition mb-6"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            accept=".png, .jpg, .jpeg, .pdf" 
            multiple
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
          />
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Select multiple files to batch upload
          </p>
          <p className="text-xs text-slate-500">PNG, JPG, PDF supported. You can select multiple.</p>
        </div>

        {imageFiles.length > 0 && (
          <div className="mb-6 max-h-32 overflow-y-auto space-y-2 pr-2">
            {imageFiles.map((f, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{f.name}</span>
                <button onClick={() => removeImage(i)} className="text-red-400 hover:text-red-300 text-xs px-2">Remove</button>
              </div>
            ))}
          </div>
        )}

        <button 
          onClick={handleBatchIssue} disabled={issuing || imageFiles.length === 0}
          className="w-full py-3.5 bg-brand-600 dark:bg-white text-white dark:text-slate-950 rounded-xl font-bold hover:bg-brand-700 dark:hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {issuing ? 'Processing...' : (domainScope === 'internal' ? `Batch Issue ${imageFiles.length} Records` : 'Issue to student')}
        </button>
      </div>
    </div>
  );
};

export default BatchImageIssueModal;