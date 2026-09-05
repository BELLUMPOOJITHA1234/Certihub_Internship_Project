import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { ShieldCheck, Calendar, User, Building2, Award, Download, CheckCircle2, XCircle } from 'lucide-react';
import logo from '../assets/logo.png';

const Verify = () => {
  const { id } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const docRef = doc(db, "certificates", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCert({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Certificate not found in our registry.");
        }
      } catch (err) {
        console.error("Error fetching certificate:", err);
        setError("Failed to connect to verification server.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCert();
  }, [id]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-20 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-12 text-center">
          <Link to="/" className="inline-block mb-8">
            <img src={logo} alt="CertiHub Logo" className="h-12 w-auto" />
          </Link>
          <h1 className="text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">Credential Verification</h1>
          <p className="mt-3 text-slate-500 font-medium tracking-tight">Official CertiHub Verification Registry</p>
        </div>

        {error ? (
          <div className="rounded-[2.5rem] bg-white p-12 text-center shadow-2xl dark:bg-slate-900 border border-red-100 dark:border-red-900/20">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-500 dark:bg-red-900/20">
              <XCircle className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Verification Failed</h2>
            <p className="mt-4 text-slate-500">{error}</p>
            <Link to="/" className="mt-8 inline-block btn-primary">Return to Homepage</Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[3rem] bg-white shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between bg-emerald-500 px-8 py-6 text-white sm:px-12">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-white/20 p-2">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Registry Status</div>
                  <div className="text-xl font-black tracking-tight">Officially Verified</div>
                </div>
              </div>
              <ShieldCheck className="h-10 w-10 opacity-30" />
            </div>

            <div className="grid gap-0 sm:grid-cols-[1fr_auto_1fr]">
              <div className="p-8 sm:p-12">
                <div className="mb-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Issued To</p>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-white/5">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{cert.candidateName || 'Verified Student'}</h3>
                      <p className="text-sm font-bold text-slate-400">Recipient</p>
                    </div>
                  </div>
                </div>

                <div className="mb-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Credential Details</p>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">{cert.title}</h3>
                      <p className="text-sm font-bold text-slate-400">{cert.category}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden w-px bg-slate-100 dark:bg-white/5 sm:block my-12" />

              <div className="p-8 sm:p-12">
                <div className="mb-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Issuing Entity</p>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-white/5">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">{cert.issuer}</h3>
                      <p className="text-sm font-bold text-emerald-500 flex items-center gap-1.5 uppercase tracking-widest text-[10px] font-black">
                        <CheckCircle2 className="h-3 w-3" /> Partner Account
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Date Issued</p>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-white/5">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">{cert.date || 'Jan 2024'}</h3>
                      <p className="text-sm font-bold text-slate-400">Archived Date</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/50 p-8 text-center dark:border-white/5 dark:bg-white/[0.02] sm:p-10">
              <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
                <a 
                  href={cert.cloudinaryUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary w-full sm:w-auto"
                >
                  <Download className="h-4 w-4" /> Download Official PDF
                </a>
                <p className="text-xs font-bold text-slate-400">
                  Registry ID: <span className="font-mono text-slate-600 dark:text-slate-300">{cert.id}</span>
                </p>
              </div>
            </div>
          </div>
        )}
        
        <p className="mt-12 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Powered by CertiHub Intelligent Verification Network
        </p>
      </div>
    </div>
  );
};

export default Verify;