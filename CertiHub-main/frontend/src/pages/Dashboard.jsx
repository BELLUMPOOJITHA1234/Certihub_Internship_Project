import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, Search, ExternalLink, Trash2, Target, ChevronRight, Share2, Copy, Check, X, Sparkles, CheckCircle2, Tag, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebase/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import ForcedUsernameModal from '../components/modals/ForcedUsernameModal';

const CATEGORY_CONFIG_KEY = 'certihub_category_config';

const DEFAULT_CATEGORIES = [
  { name: 'Internship', skipAI: false },
  { name: 'Course', skipAI: false },
  { name: 'Project', skipAI: false },
  { name: 'Achievement', skipAI: false },
  { name: 'Workshop', skipAI: false },
  { name: 'Competition', skipAI: false },
  { name: 'Volunteer', skipAI: false },
  { name: 'Participation', skipAI: true },
  { name: 'Other', skipAI: false },
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } } };
const modalOverlay = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } }, exit: { opacity: 0, transition: { duration: 0.15 } } };
const modalContent = { hidden: { opacity: 0, scale: 0.95, y: 8 }, visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }, exit: { opacity: 0, scale: 0.95, y: 8, transition: { duration: 0.15 } } };

const loadCategoryConfig = () => {
  try {
    const saved = localStorage.getItem(CATEGORY_CONFIG_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* invalid JSON */ }
  return DEFAULT_CATEGORIES;
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [careerStatus, setCareerStatus] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [sharingId, setSharingId] = useState(null);
  const [generatedPost, setGeneratedPost] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingConsents, setPendingConsents] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');

  const [categoryConfig, setCategoryConfig] = useState(loadCategoryConfig);
  const [showCategorySettings, setShowCategorySettings] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSkipAI, setNewCatSkipAI] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('All');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(CATEGORY_CONFIG_KEY, JSON.stringify(categoryConfig));
  }, [categoryConfig]);

  const presetCategories = categoryConfig.map(c => c.name);

  async function fetchCareerStatus(certs) {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/career-advice`, { certificates: certs }, { headers: { Authorization: `Bearer ${token}` } });
      setCareerStatus(response.data);
    } catch (error) {
      console.error("Failed to fetch career status", error);
    }
  }

  async function fetchCertificates(userId, email) {
    try {
      setFetching(true);
      const q = query(collection(db, "certificates"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const certs = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      certs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setCertificates(certs);
      if (email) {
        const consentQ = query(collection(db, "certificates"), where("studentEmail", "==", email), where("consentStatus", "==", "pending"));
        const consentSnapshot = await getDocs(consentQ);
        setPendingConsents(consentSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }
      if (certs.length > 0) fetchCareerStatus(certs);
    } catch (error) {
      console.error("Error fetching certificates:", error);
    } finally {
      setFetching(false);
    }
  }

  async function fetchUserData(uid) {
    try {
      const docSnap = await getDoc(doc(db, "users", uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDbUser(data);
        return data;
      }
    } catch (err) {
      console.error("Error fetching user data", err);
    }
    return null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserData(currentUser.uid);
        fetchCertificates(currentUser.uid, currentUser.email);
      } else {
        setFetching(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File is too large! Maximum size is 10MB.");
        return;
      }
      setPendingFile(selectedFile);
      setUploadCategory('');
      setShowUploadModal(true);
    }
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!pendingFile || !user || !uploadCategory) return;

    const catConfig = categoryConfig.find(c => c.name === uploadCategory);
    const skipAI = catConfig?.skipAI || false;

    setShowUploadModal(false);
    setLoading(true);
    const uploadToast = toast.loading(skipAI ? "Uploading certificate..." : "Analyzing certificate...");

    if (skipAI) {
      try {
        const formData = new FormData();
        formData.append('certificate', pendingFile);
        const token = await auth.currentUser?.getIdToken();
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload-only`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` }
        });
        const newCert = {
          userId: user.uid,
          cloudinaryUrl: response.data.cloudinaryUrl,
          title: pendingFile.name.replace(/\.[^/.]+$/, ''),
          issuer: 'Personal Upload',
          userCategory: uploadCategory,
          category: uploadCategory,
          skills: [],
          aiSummary: '',
          resumeBullets: [],
          createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, "certificates"), newCert);
        setCertificates([{ id: docRef.id, ...newCert, createdAt: { toMillis: () => Date.now() } }, ...certificates]);
        toast.success("Certificate uploaded!", { id: uploadToast });
      } catch (error) {
        console.error("Upload failed", error);
        toast.error("Failed to upload certificate.", { id: uploadToast });
      } finally {
        setLoading(false);
        setPendingFile(null);
        setUploadCategory('');
      }
      return;
    }

    try {
      const formData = new FormData();
      formData.append('certificate', pendingFile);
      const token = await auth.currentUser?.getIdToken();
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` }
      });
      const data = response.data;
      const newCert = {
        userId: user.uid,
        cloudinaryUrl: data.cloudinaryUrl,
        candidateName: data.aiData.candidateName || '',
        title: data.aiData.certificateTitle || 'Unknown Certificate',
        issuer: data.aiData.organization || 'Unknown Issuer',
        category: data.aiData.category || 'Other',
        userCategory: uploadCategory,
        skills: data.aiData.skills || [],
        aiSummary: data.aiData.aiSummary || '',
        resumeBullets: data.aiData.resumeBullets || [],
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, "certificates"), newCert);
      setCertificates([{ id: docRef.id, ...newCert, createdAt: { toMillis: () => Date.now() } }, ...certificates]);
      toast.success("Certificate analyzed successfully!", { id: uploadToast });
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to analyze certificate.", { id: uploadToast });
    } finally {
      setLoading(false);
      setPendingFile(null);
      setUploadCategory('');
    }
  };

  const handleDelete = async (certId) => {
    if (!window.confirm("Are you sure you want to delete this certificate?")) return;
    const certToDelete = certificates.find(c => c.id === certId);
    if (!certToDelete) return;
    try {
      if (certToDelete.cloudinaryUrl) {
        const token = await auth.currentUser?.getIdToken();
        await axios.post(`${import.meta.env.VITE_API_URL}/api/delete-file`, { url: certToDelete.cloudinaryUrl }, { headers: { Authorization: `Bearer ${token}` } });
      }
      await deleteDoc(doc(db, "certificates", certId));
      setCertificates(prev => prev.filter(c => c.id !== certId));
      toast.success("Certificate deleted.");
    } catch (error) {
      console.error("Error deleting certificate:", error);
      toast.error("Failed to delete certificate resources.");
    }
  };

  const handleShareOnLinkedIn = async (cert) => {
    setSharingId(cert.id);
    const loadToast = toast.loading("Generating AI social post...");
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/generate-post`, { certificate: cert }, { headers: { Authorization: `Bearer ${token}` } });
      setGeneratedPost(response.data.post);
      setShowShareModal(true);
      toast.success("Post generated!", { id: loadToast });
    } catch (error) {
      console.error("LinkedIn generation failed", error);
      toast.error("Failed to generate social post.", { id: loadToast });
      setSharingId(null);
    }
  };

  const copyToClipboard = () => { navigator.clipboard.writeText(generatedPost); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handleUpdateCategory = async (certId, newCategory) => {
    try {
      const certRef = doc(db, "certificates", certId);
      await updateDoc(certRef, { userCategory: newCategory });
      setCertificates(prev => prev.map(c => c.id === certId ? { ...c, userCategory: newCategory } : c));
      setEditingCategoryId(null);
      setEditingCategoryValue('');
      toast.success("Category updated!");
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category.");
    }
  };

  const handleConsent = async (certId, status) => {
    try {
      const docRef = doc(db, "certificates", certId);
      await updateDoc(docRef, { consentStatus: status, userId: user.uid, lastUpdated: serverTimestamp() });
      toast.success(`Certificate ${status === 'accepted' ? 'added to your vault' : 'rejected'}`);
      fetchCertificates(user.uid, user.email);
    } catch { toast.error("Handshake failed"); }
  };

  const addCategoryConfig = () => {
    if (!newCatName.trim()) return;
    if (categoryConfig.some(c => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      toast.error("Category already exists");
      return;
    }
    setCategoryConfig([...categoryConfig, { name: newCatName.trim(), skipAI: newCatSkipAI }]);
    setNewCatName('');
    setNewCatSkipAI(false);
    toast.success("Category added!");
  };

  const removeCategoryConfig = (name) => {
    setCategoryConfig(categoryConfig.filter(c => c.name !== name));
  };

  const toggleSkipAI = (name) => {
    setCategoryConfig(categoryConfig.map(c => c.name === name ? { ...c, skipAI: !c.skipAI } : c));
  };

  const categories = ["All", ...new Set(certificates.map(c => c.userCategory || "Other"))].sort();
  const filteredCerts = certificates.filter(c => {
    const matchesSearch = (c.title || "").toLowerCase().includes(searchTerm.toLowerCase()) || (c.issuer || "").toLowerCase().includes(searchTerm.toLowerCase());
    const itemCategory = c.userCategory || 'Other';
    const matchesCategory = selectedCategory === 'All' || itemCategory.toLowerCase() === selectedCategory.toLowerCase();
    const isVerified = c.isInstitutional || c.verificationStatus === 'verified';
    if (activeTab === 'verified') return matchesSearch && matchesCategory && isVerified;
    if (activeTab === 'personal') return matchesSearch && matchesCategory && !isVerified;
    return matchesSearch && matchesCategory;
  });

  if (!user && !fetching) return <div className="py-20 text-center font-medium text-slate-500">Please log in to view your dashboard.</div>;

  return (
    <div className="app-shell py-8">
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="eyebrow mb-2.5">Your Certificates</div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Welcome, {dbUser?.displayName?.split(' ')[0] || 'User'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">Upload and manage your certificates here.</p>
        </div>
        {user && (
          <div className="flex flex-col sm:flex-row gap-3 mt-3 md:mt-0">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" />
            <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="btn-primary">
              <UploadCloud className="h-4 w-4" /> {loading ? "Analyzing..." : "Upload Certificate"}
            </button>
            <Link to={`/user/${dbUser?.username || user.uid}`} className="btn-secondary">
              <ExternalLink className="h-4 w-4" /> View Public Profile
            </Link>
          </div>
        )}
      </div>

      <hr className="mb-8 border-slate-200/60 dark:border-white/[0.06]" />

      {careerStatus && (
        <div className="relative mb-10 flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl bg-slate-950 p-7 text-white lg:flex-row">
          <div className="absolute top-0 right-0 p-7 opacity-5"><Target className="w-40 h-40" /></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10"><Target className="w-7 h-7 text-brand-400" /></div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Your Job Goal</div>
              <div className="text-xl font-bold">{careerStatus.suggestedRole}</div>
            </div>
          </div>
          <div className="flex-1 max-w-md w-full relative z-10">
            <div className="flex justify-between text-[10px] font-semibold mb-2"><span className="text-slate-400 uppercase tracking-widest">Job Score</span><span className="text-brand-400">{careerStatus.matchScore}%</span></div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-600 to-brand-500 rounded-full" style={{ width: `${careerStatus.matchScore}%` }} />
            </div>
          </div>
          <Link to="/advisor" className="relative z-10 flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold transition-colors hover:bg-brand-500">
            Full Career Plan <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {pendingConsents.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Action Required: Institutional Handshake</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {pendingConsents.map(cert => (
              <div key={cert.id} className="card p-5 border-l-4 border-brand-500 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-brand-50 rounded-xl dark:bg-brand-900/20">
                    <CheckCircle2 className="w-6 h-6 text-brand-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{cert.title}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">{cert.issuer}</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => handleConsent(cert.id, 'rejected')} className="flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors dark:hover:bg-white/[0.04]">Reject</button>
                  <button onClick={() => handleConsent(cert.id, 'accepted')} className="flex-1 md:flex-none px-5 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold transition-colors hover:bg-brand-700">Accept & Link</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div>
        <div className="flex flex-col sm:flex-row justify-between items-end mb-6 gap-4">
          <div className="w-full sm:w-auto">
            <h2 className="section-title flex items-center gap-2 mb-4"><FileText className="w-5 h-5 text-brand-600" /> My Workspace</h2>
            <div className="flex p-0.5 bg-slate-100 dark:bg-white/[0.04] rounded-lg w-fit">
              {['all', 'verified', 'personal'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 capitalize ${activeTab === tab ? 'bg-white dark:bg-white/10 shadow-sm text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}>{tab}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search skills..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="field py-2.5 pl-9 pr-3 text-sm" />
            </div>
            <button onClick={() => setShowCategorySettings(true)} className="p-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-400 hover:text-brand-600 transition-colors" title="Category Settings">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`rounded-lg border px-3 py-1 text-[11px] font-semibold transition-colors duration-150 ${selectedCategory === cat ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-400'}`}>{cat}</button>
          ))}
        </div>

        {fetching ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-[3px] border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Synchronizing Vault...</p>
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="card py-16 text-center border-dashed border-2">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">No certificates match your filters.</p>
          </div>
        ) : (
          <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" variants={stagger} initial="hidden" animate="visible">
            {filteredCerts.map((cert) => (
              <motion.div key={cert.id} variants={fadeUp} className="card flex overflow-hidden flex-col hover:shadow-card-hover">
                <div className="h-36 bg-slate-100 overflow-hidden relative border-b border-slate-200/60">
                  <img src={cert.cloudinaryUrl?.replace(/\.pdf$/i, '.jpg')} alt={cert.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://placehold.co/400x200/e2e8f0/475569?text=PDF' }} />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="line-clamp-1 text-sm font-bold text-slate-950 dark:text-white">{cert.title}</h3>
                    {(cert.isInstitutional || cert.verificationStatus === 'verified') && (
                      <span className="flex items-center gap-1 text-[8px] font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded dark:bg-brand-900/20 dark:text-brand-400 shrink-0">
                        <CheckCircle2 className="w-2 h-2" /> VERIFIED
                      </span>
                    )}
                  </div>
                  <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">{cert.issuer}</p>
                  {cert.category && cert.category !== cert.userCategory && (
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Domain:</span>
                      <span className="chip text-[9px]">{cert.category}</span>
                    </div>
                  )}
                  {cert.userCategory && (
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-brand-500" />
                      <span className="text-[9px] font-semibold text-brand-600 dark:text-brand-400">{cert.userCategory}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-auto mb-3">
                    {cert.skills?.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="chip text-[9px]">{skill}</span>
                    ))}
                  </div>
                  <div className="flex gap-1.5 relative">
                    <Link to={`/certificate/${cert.id}`} className="flex-1 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] py-1.5 text-center text-xs font-medium text-slate-700 transition-colors hover:border-brand-200 hover:text-brand-700 dark:text-slate-300">View</Link>
                    <div className="relative">
                      <button
                        onClick={() => { setEditingCategoryId(editingCategoryId === cert.id ? null : cert.id); setEditingCategoryValue(cert.userCategory || ''); }}
                        className={`p-1.5 border border-slate-200 dark:border-white/[0.08] rounded-lg transition-colors ${editingCategoryId === cert.id ? 'bg-brand-50 text-brand-600 border-brand-200 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/30' : 'bg-white dark:bg-white/[0.04] text-slate-400 hover:text-brand-600'}`}
                        title="Set Category"
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                      {editingCategoryId === cert.id && (
                        <div className="absolute bottom-full right-0 mb-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl shadow-float p-2 z-50">
                          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-2 mb-1.5">Category</div>
                          <div className="grid grid-cols-2 gap-1 mb-2 max-h-40 overflow-y-auto">
                            {presetCategories.map(cat => (
                              <button
                                key={cat}
                                onClick={() => handleUpdateCategory(cert.id, cat)}
                                className={`px-2 py-1.5 rounded-lg text-[11px] font-medium text-left transition-colors ${(cert.userCategory || 'Other') === cat ? 'bg-brand-600 text-white' : 'bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08]'}`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={editingCategoryValue}
                              onChange={(e) => setEditingCategoryValue(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter' && editingCategoryValue.trim()) handleUpdateCategory(cert.id, editingCategoryValue.trim()); }}
                              placeholder="Custom..."
                              className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-950 text-xs outline-none focus:border-brand-400"
                            />
                            <button
                              onClick={() => { if (editingCategoryValue.trim()) handleUpdateCategory(cert.id, editingCategoryValue.trim()); }}
                              className="px-2 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition-colors"
                            >
                              Set
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <button onClick={() => handleShareOnLinkedIn(cert)} disabled={sharingId === cert.id} className="p-1.5 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-400 hover:text-brand-600 transition-colors" title="AI Social Post">
                      {sharingId === cert.id ? <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /> : <Share2 className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(cert.id)} className="p-1.5 bg-white dark:bg-white/[0.04] hover:bg-red-50 dark:hover:bg-red-500/10 border border-slate-200 dark:border-white/[0.08] hover:border-red-200 rounded-lg text-slate-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="w-4 h-4" />                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Upload Category Modal */}
      <AnimatePresence>
      {showUploadModal && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center px-6" variants={modalOverlay} initial="hidden" animate="visible" exit="exit">
          <div onClick={() => { setShowUploadModal(false); setPendingFile(null); }} className="absolute inset-0 bg-slate-900/60" />
          <motion.div variants={modalContent} initial="hidden" animate="visible" exit="exit" className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-float p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-brand-600 text-white rounded-lg flex items-center justify-center"><UploadCloud className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Select Category</h3>
                  <p className="text-xs text-slate-500">{pendingFile?.name}</p>
                </div>
              </div>
              <button onClick={() => { setShowUploadModal(false); setPendingFile(null); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
              {categoryConfig.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => setUploadCategory(cat.name)}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all ${uploadCategory === cat.name ? 'border-brand-600 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 dark:border-white/[0.08] hover:border-brand-300'}`}
                >
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">{cat.name}</div>
                  {cat.skipAI && (
                    <div className="mt-1 text-[9px] font-medium text-amber-600 dark:text-amber-400">No AI</div>
                  )}
                </button>
              ))}
            </div>

            {uploadCategory && (
              <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  {categoryConfig.find(c => c.name === uploadCategory)?.skipAI ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        <strong>{uploadCategory}</strong> — Certificate will be uploaded without AI analysis
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-brand-500" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        <strong>{uploadCategory}</strong> — AI will extract skills, title, and summary
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!uploadCategory || loading}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Upload Certificate'}
            </button>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Category Settings Modal */}
      <AnimatePresence>
      {showCategorySettings && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center px-6" variants={modalOverlay} initial="hidden" animate="visible" exit="exit">
          <div onClick={() => setShowCategorySettings(false)} className="absolute inset-0 bg-slate-900/60" />
          <motion.div variants={modalContent} initial="hidden" animate="visible" exit="exit" className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-float p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-brand-600 text-white rounded-lg flex items-center justify-center"><Settings className="w-5 h-5" /></div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Category Settings</h3>
              </div>
              <button onClick={() => setShowCategorySettings(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Categories marked <strong>"Skip AI"</strong> won't trigger AI analysis — just upload and store.
            </p>

            <div className="space-y-2 mb-5">
              {categoryConfig.map(cat => (
                <div key={cat.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{cat.name}</span>
                    {cat.skipAI && <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 px-1.5 py-0.5 rounded">No AI</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleSkipAI(cat.name)} className={`relative w-9 h-5 rounded-full transition-colors ${cat.skipAI ? 'bg-amber-500' : 'bg-slate-300 dark:bg-white/10'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${cat.skipAI ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                    <button onClick={() => removeCategoryConfig(cat.name)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addCategoryConfig(); }}
                placeholder="New category name..."
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-950 text-sm outline-none focus:border-brand-400"
              />
              <button onClick={addCategoryConfig} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors">Add</button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
      {showShareModal && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center px-6" variants={modalOverlay} initial="hidden" animate="visible" exit="exit">
          <div onClick={() => { setShowShareModal(false); setSharingId(null); }} className="absolute inset-0 bg-slate-900/60" />
          <motion.div variants={modalContent} initial="hidden" animate="visible" exit="exit" className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-float overflow-hidden">
            <div className="p-7">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-brand-600 text-white rounded-lg flex items-center justify-center"><Sparkles className="w-5 h-5" /></div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Achievement Post</h3>
                </div>
                <button onClick={() => { setShowShareModal(false); setSharingId(null); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div className="bg-slate-50 dark:bg-white/[0.04] p-5 rounded-xl border border-slate-100 dark:border-white/[0.08] relative">
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap italic">"{generatedPost}"</p>
                <button onClick={copyToClipboard} className="absolute top-3 right-3 p-1.5 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-white/[0.08] text-slate-400 hover:text-brand-600 transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="mt-6 flex gap-2">
                <button onClick={() => { copyToClipboard(); const shareProxyUrl = `${import.meta.env.VITE_API_URL}/api/share/${sharingId}`; window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareProxyUrl)}`, '_blank'); }} className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-semibold transition-colors hover:bg-brand-700 flex items-center justify-center gap-2 text-sm">
                  <ExternalLink className="w-4 h-4" /> Copy & Share Portfolio
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <ForcedUsernameModal dbUser={dbUser} user={user} onUsernameSet={(newUsername) => setDbUser({ ...dbUser, username: newUsername })} />
    </div>
  );
};

export default Dashboard;
