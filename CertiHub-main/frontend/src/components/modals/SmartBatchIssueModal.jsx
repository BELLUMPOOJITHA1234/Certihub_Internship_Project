import { useState, useRef } from 'react';
import { UploadCloud, FileText, Download, Sparkles, X } from 'lucide-react';
import axios from 'axios';
import { auth } from '../../firebase/firebase';
import { toast } from 'react-hot-toast';

const SmartBatchIssueModal = ({ onClose }) => {
  const [certFiles, setCertFiles] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [issuing, setIssuing] = useState(false);
  
  const certInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const downloadTemplate = () => {
    const headers = "EmployeeName,EmployeeEmail\n";
    const example = "Jane Smith,jane.smith@organization.com\nJohn Doe,john.doe@organization.com\n";
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CertiHub_Mapping_Template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCertUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/') || file.type === 'application/pdf');
      setCertFiles(prev => [...prev, ...files]);
    }
  };

  const handleCsvUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const removeCert = (index) => {
    setCertFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSmartIssue = async (e) => {
    e.preventDefault();
    if (certFiles.length === 0) return toast.error("Please select at least one certificate file.");
    if (!csvFile) return toast.error("Please upload the mapping CSV file.");
    
    setIssuing(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = text.split('\n').filter(row => row.trim().length > 0);
        
        if (rows.length < 2) throw new Error("CSV appears empty or missing data.");
        
        const mappingData = [];
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (!cols || cols.length < 2) continue;
          
          mappingData.push({
            name: cols[0].replace(/"/g, '').trim(),
            email: cols[1].replace(/"/g, '').trim().toLowerCase()
          });
        }

        const token = await auth.currentUser?.getIdToken();
        const formData = new FormData();
        
        formData.append('mappingData', JSON.stringify(mappingData));
        
        certFiles.forEach(file => {
          formData.append('certificates', file);
        });

        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/organization/smart-batch-issue`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        toast.success(res.data.message || `Successfully processed certificates!`);
        onClose();
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.error || err.message || "Failed to process smart issuance.");
      } finally {
        setIssuing(false);
      }
    };
    reader.readAsText(csvFile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/50">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-8 rounded-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-hide">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          ✕
        </button>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-6">
          <Sparkles className="text-brand-500 w-6 h-6" /> AI Smart Batch Issue
        </h3>
        
        <div className="space-y-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Upload your visual certificates and a mapping CSV. Our AI will analyze each certificate, extract the name printed on it, match it with the CSV to find their email, and automatically issue the credential!
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="field-label mb-2 block">1. Certificate Files</label>
              <div 
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 text-center cursor-pointer hover:border-brand-500/50 transition h-32 flex flex-col justify-center"
                onClick={() => certInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  accept=".png, .jpg, .jpeg, .pdf" 
                  multiple
                  className="hidden" 
                  ref={certInputRef} 
                  onChange={handleCertUpload} 
                />
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {certFiles.length > 0 ? `${certFiles.length} files selected` : 'Select Image/PDFs'}
                </p>
              </div>
            </div>

            <div>
              <label className="field-label mb-2 block">2. Mapping CSV</label>
              <div 
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 text-center cursor-pointer hover:border-brand-500/50 transition h-32 flex flex-col justify-center"
                onClick={() => csvInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={csvInputRef} 
                  onChange={handleCsvUpload} 
                />
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {csvFile ? csvFile.name : 'Select CSV file'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-brand-50 dark:bg-brand-900/10 rounded-xl p-4 border border-brand-100 dark:border-brand-900/30">
            <span className="text-xs font-medium text-brand-700 dark:text-brand-300">
              CSV Format: <strong>EmployeeName, EmployeeEmail</strong>
            </span>
            <button onClick={downloadTemplate} className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline">
              <Download className="w-3 h-3" /> Template
            </button>
          </div>

          {certFiles.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {certFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
                    <span className="truncate max-w-[120px]">{f.name}</span>
                    <button onClick={() => removeCert(i)} className="text-slate-400 hover:text-red-500 transition"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            onClick={handleSmartIssue} disabled={issuing || !csvFile || certFiles.length === 0}
            className="w-full py-4 bg-brand-600 dark:bg-white text-white dark:text-slate-950 rounded-xl font-bold hover:bg-brand-700 dark:hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {issuing ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white dark:border-slate-950/30 dark:border-t-slate-950 rounded-full animate-spin"></div> AI processing batch...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Issue Smart Credentials</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartBatchIssueModal;