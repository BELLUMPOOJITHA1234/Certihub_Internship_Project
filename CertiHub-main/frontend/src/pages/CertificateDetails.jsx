import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { ArrowLeft, CheckCircle, Download, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

const CertificateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async (status) => {
    setVerifying(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/api/mentor/verify`, {
        certificateId: id,
        status: status,
        comments: "Verified via Mentor Review"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Certificate ${status}!`);
      fetchCertificate();
    } catch {
      toast.error("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const [isHealing, setIsHealing] = useState(false);

  const fetchCertificate = async () => {
    try {
      const docRef = doc(db, "certificates", id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setCert(data);

        if ((data.title === "Unknown Certificate" || !data.title || data.title.includes("Unknown")) && !isHealing) {
           autoFixCertificate(data);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const autoFixCertificate = async (certificate) => {
    setIsHealing(true);
    try {
      let imageUrl = certificate.cloudinaryUrl;
      if (imageUrl.includes('/upload/')) {
        imageUrl = imageUrl.replace('/upload/', '/upload/f_jpg,q_auto:best/');
      }
      imageUrl = imageUrl.replace(/\.pdf$/i, '.jpg');

      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      
      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(imageBlob);
      });

      const token = await auth.currentUser?.getIdToken();
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/re-analyze`, {
        id: certificate.id,
        base64Image: base64Data,
        mimetype: 'image/jpeg'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newAiData = response.data.aiData;
      if (newAiData && newAiData.certificateTitle && !newAiData.certificateTitle.toLowerCase().includes('unknown')) {
        const docRef = doc(db, "certificates", id);
        await updateDoc(docRef, {
          title: newAiData.certificateTitle,
          issuer: newAiData.organization,
          category: newAiData.category,
          skills: newAiData.skills,
          date: newAiData.date,
          aiSummary: newAiData.aiSummary,
          resumeBullets: newAiData.resumeBullets,
          lastAnalyzed: serverTimestamp()
        });
        
        const updatedDoc = await getDoc(docRef);
        const updatedData = { id: updatedDoc.id, ...updatedDoc.data() };
        setCert(updatedData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsHealing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (id) await fetchCertificate();
      if (auth.currentUser) {
        try {
          const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (!cancelled && docSnap.exists()) setUserRole(docSnap.data().role);
        } catch (e) {
          console.error(e);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);



  if (loading) return <div className="text-center py-20 text-slate-500">Loading details...</div>;
  if (!cert) return <div className="text-center py-20 text-red-500">Certificate not found.</div>;

  return (
    <motion.div className="app-shell max-w-6xl py-10" variants={stagger} initial="hidden" animate="visible">
      <motion.div variants={fadeUp} className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 font-bold text-slate-500 transition hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-400"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <a 
            href={cert.cloudinaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-full text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition"
          >
            <Download className="w-4 h-4" /> Download Certificate
          </a>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid lg:grid-cols-5 gap-10">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden p-2">
            <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <img 
                src={cert.cloudinaryUrl?.replace(/\.pdf$/i, '.jpg')} 
                alt={cert.title} 
                className="w-full object-contain"
                onError={(e) => { e.target.src = 'https://placehold.co/600x400/e2e8f0/475569?text=PDF+Document' }}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div>
            <div className="eyebrow mb-4">Official Verification</div>
            
            <>
              {isHealing && (
                <div className="flex items-center gap-2 mb-4 px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full w-fit">
                  <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-500">Self-Healing AI Active</span>
                </div>
              )}
              <h1 className="mb-4 text-5xl font-black tracking-tight text-slate-950 dark:text-white leading-tight">
                {cert.title === "Unknown Certificate" && isHealing ? "Analyzing Document..." : cert.title}
              </h1>
              <p className="mb-10 text-2xl font-bold text-slate-500 dark:text-slate-400">
                Issued by <span className="text-brand-600 dark:text-brand-500">{cert.issuer}</span>
              </p>
            </>

            <div className="flex flex-wrap gap-6 mb-12 mt-8">
               <div className="flex flex-col border-l-2 border-slate-200 dark:border-white/10 pl-4">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Issue Date</span>
                   <span className="font-bold text-slate-900 dark:text-white">{cert.date || 'Jan 2024'}</span>
               </div>
               <div className="flex flex-col border-l-2 border-slate-200 dark:border-white/10 pl-4">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Domain</span>
                   <span className="font-bold text-slate-900 dark:text-white">{cert.category || 'Professional'}</span>
               </div>
               {cert.userCategory && (
                 <div className="flex flex-col border-l-2 border-brand-300 dark:border-brand-500/30 pl-4">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</span>
                   <span className="font-bold text-brand-600 dark:text-brand-400">{cert.userCategory}</span>
                 </div>
               )}
            </div>
            
            <div className="space-y-12">
              <section>
                <h3 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Credential Description</h3>
                <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-300 font-medium italic border-l-4 border-slate-100 dark:border-white/5 pl-6">
                  {cert.aiSummary || "This credential verifies the professional standing and completion of requirements for this specific course of study."}
                </p>
              </section>

              {cert.skills && cert.skills.length > 0 && (
                <section>
                  <h3 className="mb-4 border-b border-slate-900/10 pb-2 text-lg font-black text-slate-950 dark:border-white/10 dark:text-white">Verified Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {cert.skills.map((skill, idx) => (
                      <span key={idx} className="chip px-4 py-2">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {cert.resumeBullets && cert.resumeBullets.length > 0 && (
                <section>
                  <h3 className="mb-4 border-b border-slate-900/10 pb-2 text-lg font-black text-slate-950 dark:border-white/10 dark:text-white">Generated Resume Points</h3>
                  <ul className="space-y-3">
                    {cert.resumeBullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-slate-300">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
            
            {userRole === 'mentor' && (
              <div className="mt-12 p-8 rounded-[2rem] bg-slate-900 text-white shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-brand-500 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black">Verification Handshake</h3>
                </div>
                
                {cert.verificationStatus ? (
                  <div className={`p-4 rounded-xl font-bold flex items-center gap-2 ${cert.verificationStatus === 'verified' ? 'bg-teal-500/20 text-teal-400' : 'bg-red-500/20 text-red-400'}`}>
                    {cert.verificationStatus === 'verified' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    Already {cert.verificationStatus.charAt(0).toUpperCase() + cert.verificationStatus.slice(1)} by {cert.verifiedBy}
                  </div>
                ) : (
                  <>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                      As an authorized mentor, you are responsible for validating the authenticity of this document. 
                      Once verified, it will be stamped with your digital signature.
                    </p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleVerify('verified')}
                        disabled={verifying}
                        className="flex-1 px-6 py-3 bg-brand-600 rounded-xl font-black hover:bg-brand-700 transition disabled:opacity-50"
                      >
                        {verifying ? 'Processing...' : 'Verify Record'}
                      </button>
                      <button 
                        onClick={() => handleVerify('rejected')}
                        disabled={verifying}
                        className="flex-1 px-6 py-3 bg-white/10 rounded-xl font-black hover:bg-white/20 transition disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CertificateDetails;