import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Download, Type, Tag, Sparkles } from 'lucide-react';
import { db } from '../../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const CsvBulkIssueModal = ({ onClose }) => {
  const [csvFile, setCsvFile] = useState(null);
  const [issuing, setIssuing] = useState(false);
  const [certTitle, setCertTitle] = useState('');
  const [certCategory, setCertCategory] = useState('Course');
  const [certSkills, setCertSkills] = useState('');
  
  const fileInputRef = useRef(null);

  const downloadTemplate = () => {
    const headers = "EmployeeName,EmployeeEmail\n";
    const example = "Jane Smith,jane.smith@organization.com\nJohn Doe,john.doe@organization.com\n";
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CertiHub_Employee_List_Template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCsvUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleBulkIssue = async () => {
    if (!certTitle.trim()) return toast.error("Please enter a Certificate Title.");
    if (!certSkills.trim()) return toast.error("Please enter at least one skill.");
    if (!csvFile) return toast.error("Please upload the Employee CSV file.");
    
    setIssuing(true);
    const skillsArray = certSkills.split(',').map(s => s.trim()).filter(Boolean);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const rows = text.split('\n').filter(row => row.trim().length > 0);
        
        if (rows.length < 2) throw new Error("CSV appears empty or missing data.");
        
        let successCount = 0;
        
        // Skip header row
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (!cols || cols.length < 2) continue; // We only need Name and Email now
          
          const name = cols[0].replace(/"/g, '').trim();
          const email = cols[1].replace(/"/g, '').trim().toLowerCase();
          
          const newCert = {
            candidateName: name,
            studentEmail: email,
            title: certTitle.trim(),
            issuer: "Corporate Organization",
            category: certCategory,
            skills: skillsArray,
            consentStatus: 'pending',
            isInstitutional: false,
            domainScope: 'external',
            verificationStatus: 'verified',
            cloudinaryUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop', // Placeholder background
            createdAt: serverTimestamp()
          };
          
          await addDoc(collection(db, "certificates"), newCert);
          successCount++;
        }
        
        toast.success(`Successfully issued ${successCount} credentials!`);
        onClose();
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Failed to process CSV file.");
      } finally {
        setIssuing(false);
      }
    };
    reader.readAsText(csvFile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/20 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-8 rounded-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          ✕
        </button>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-6">
          <UploadCloud className="text-brand-500 w-6 h-6" /> Bulk Issue via CSV
        </h3>
        
        <div className="space-y-6">
          {/* Global Details for the Batch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="field-label">Credential Title</label>
              <div className="relative">
                <Type className="field-icon" />
                <input 
                  type="text" 
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  className="field-with-icon" 
                  placeholder="e.g. Advanced AI Integration Training" 
                />
              </div>
            </div>
            
            <div>
              <label className="field-label">Category</label>
              <div className="relative">
                <Tag className="field-icon" />
                <select 
                  value={certCategory}
                  onChange={(e) => setCertCategory(e.target.value)}
                  className="field-with-icon appearance-none bg-white dark:bg-slate-900"
                >
                  <option>Course</option>
                  <option>Workshop</option>
                  <option>Bootcamp</option>
                  <option>Achievement</option>
                  <option>Training</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="field-label">Skills (comma separated)</label>
              <div className="relative">
                <Sparkles className="field-icon" />
                <input 
                  type="text" 
                  value={certSkills}
                  onChange={(e) => setCertSkills(e.target.value)}
                  className="field-with-icon" 
                  placeholder="Leadership, AI, Management" 
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-800 w-full my-6"></div>

          {/* CSV Upload */}
          <div>
            <label className="field-label">Employee List (CSV)</label>
            <div 
              className="border-2 border-dashed border-brand-500/30 bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleCsvUpload} 
              />
              <UploadCloud className="w-10 h-10 text-brand-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {csvFile ? csvFile.name : 'Click to upload Employee CSV'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Headers: EmployeeName, EmployeeEmail</p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button onClick={downloadTemplate} className="text-xs font-bold text-brand-500 flex items-center gap-1 hover:text-brand-400 transition">
              <Download className="w-3 h-3" /> Download Employee CSV Template
            </button>
          </div>

          <button 
            onClick={handleBulkIssue} disabled={issuing || !csvFile}
            className="w-full py-4 bg-brand-600 dark:bg-white text-white dark:text-slate-950 rounded-xl font-bold hover:bg-brand-700 dark:hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {issuing ? 'Processing...' : `Issue "${certTitle || 'Credential'}" to Employees`}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CsvBulkIssueModal;
