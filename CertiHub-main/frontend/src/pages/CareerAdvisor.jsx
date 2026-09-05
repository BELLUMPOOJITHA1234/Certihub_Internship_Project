import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth, db } from '../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Briefcase, Target, TrendingUp, Compass, Sparkles, BookOpen, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } } };

const CareerAdvisor = () => {
  const [certificates, setCertificates] = useState([]);
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState(null);

  const getDomainIcon = (domain) => {
    const d = domain.toLowerCase();
    if (d.includes('web')) return <Briefcase className="w-5 h-5" />;
    if (d.includes('ai') || d.includes('intelligence')) return <Target className="w-5 h-5" />;
    if (d.includes('cloud')) return <Compass className="w-5 h-5" />;
    if (d.includes('security')) return <Target className="w-5 h-5" />;
    if (d.includes('data')) return <TrendingUp className="w-5 h-5" />;
    return <Briefcase className="w-5 h-5" />;
  };

  useEffect(() => {
    let cancelled = false;

    const generateAdvice = async (certs) => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/career-advice`, {
          certificates: certs
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data;
        if (!cancelled) {
          setAdvice(data);
          if (data.domainAnalysis?.length > 0) {
            setSelectedDomain(data.domainAnalysis[0]);
          }
        }
      } catch (error) {
        console.error("Advice generation failed:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const q = query(collection(db, "certificates"), where("userId", "==", currentUser.uid));
          const snapshot = await getDocs(q);
          const certs = snapshot.docs.map(doc => doc.data());
          if (!cancelled) setCertificates(certs);
          
          if (certs.length > 0) {
            await generateAdvice(certs);
          } else {
            if (!cancelled) setLoading(false);
          }
        } catch (error) {
          console.error("Error fetching certificates:", error);
          if (!cancelled) setLoading(false);
        }
      } else {
        if (!cancelled) setLoading(false);
      }
    });
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Looking at your skills...</p>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Briefcase className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Portfolio Empty</h2>
        <p className="text-slate-600 mb-8">Upload your certificates to unlock the AI Career Advisor.</p>
        <button 
          onClick={() => window.location.href='/dashboard'}
          className="px-6 py-3 bg-brand-600 text-white rounded-full font-bold shadow-lg hover:bg-brand-700 transition"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <motion.div className="max-w-7xl mx-auto px-6 py-10" variants={stagger} initial="hidden" animate="visible">
      <motion.div variants={fadeUp} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-brand-600" />
            AI Career Help
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">See what you are good at and where you can grow.</p>
        </div>
      </motion.div>

      {advice && (
        <motion.div variants={fadeUp} className="space-y-12">
          <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(15,23,42,0.6)]">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <Compass className="w-80 h-80 rotate-12" />
            </div>
            
            <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-500/20 text-brand-300 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-brand-500/20">
                  <Sparkles className="w-3.5 h-3.5" /> Best Job Match
                </div>
                <h2 className="text-5xl font-black mb-6 tracking-tight">{advice.suggestedRole}</h2>
                <p className="text-slate-400 text-xl leading-relaxed max-w-2xl font-medium">
                  {advice.summary}
                </p>
                
                <div className="mt-8 flex flex-wrap gap-3">
                  {advice.currentStrengths?.slice(0, 4).map((s, idx) => (
                    <span key={idx} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-teal-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="relative inline-flex items-center justify-center p-4 bg-white/5 rounded-full border border-white/10">
                  <svg className="w-56 h-56 transform -rotate-90">
                    <circle cx="112" cy="112" r="94" className="text-slate-800 stroke-current" strokeWidth="16" fill="transparent" />
                    <circle 
                      cx="112" cy="112" r="94" 
                      className="text-brand-500 stroke-current" 
                      strokeWidth="16" fill="transparent"
                      strokeDasharray={590}
                      strokeDashoffset={590 - (590 * advice.matchScore) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-5xl font-black">{advice.matchScore}%</span>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Overall Fit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-emerald-50/30 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 rounded-[2rem] p-8">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Your Strengths
              </h3>
              <div className="grid gap-3">
                {advice.currentStrengths?.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-white/5 border border-emerald-100 dark:border-emerald-900/30 rounded-xl font-bold text-slate-700 dark:text-slate-200 text-sm shadow-sm">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    {s}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-red-50/30 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30 rounded-[2rem] p-8">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" /> Gap Analysis
              </h3>
              <div className="grid gap-3">
                {advice.criticalGaps?.map((g, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white border border-red-100 rounded-xl font-bold text-slate-700 text-sm shadow-sm">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                    {g}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 px-2">Job Score by Skill Area</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {advice.domainAnalysis?.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDomain(d)}
                  className={`p-6 rounded-3xl text-left transition-all duration-300 border-2 hover:-translate-y-1 ${
                    selectedDomain?.domain === d.domain 
                      ? 'border-brand-600 bg-brand-50/50 shadow-lg shadow-brand-100 dark:bg-brand-500/10 dark:shadow-brand-900/20' 
                      : 'border-slate-100 bg-white hover:border-brand-200 dark:bg-white/5 dark:border-white/10 dark:hover:border-brand-500/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${
                    selectedDomain?.domain === d.domain ? 'bg-brand-600 text-white' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {getDomainIcon(d.domain)}
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white mb-1 truncate">{d.domain}</div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-black">{d.score}% Ready</span>
                    {selectedDomain?.domain === d.domain && <div className="w-1.5 h-1.5 bg-brand-600 rounded-full"></div>}
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${d.score > 70 ? 'bg-emerald-500' : d.score > 40 ? 'bg-amber-500' : 'bg-brand-600'}`}
                      style={{ width: `${d.score}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedDomain && (
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm dark:bg-white/5 dark:border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Recommended Courses for {selectedDomain.domain}</h3>
                </div>
                
                <div className="space-y-4">
                  {selectedDomain.neededCourses?.map((course, idx) => (
                    <div key={idx} className="group p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-brand-200 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-brand-500/50 transition-all cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white dark:bg-white/10 rounded-lg flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-sm">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{course}</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-brand-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm dark:bg-white/5 dark:border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Things You Can Do</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-2xl bg-brand-50/30 border border-brand-100 dark:bg-brand-500/10 dark:border-brand-500/20">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">1</div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      Your current score in <strong>{selectedDomain.domain}</strong> is <strong>{selectedDomain.score}%</strong>. Completing the recommended courses could boost this to <strong>{Math.min(100, selectedDomain.score + 15)}%</strong>.
                    </p>
                  </div>
                  <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 dark:bg-white/5 dark:border-white/10">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold">2</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Apply these skills to a personal project to demonstrate practical competence in addition to your certifications.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="pt-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-brand-600 text-white rounded-2xl shadow-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Your Career Plan</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">Step-by-step path to your next goal.</p>
              </div>
            </div>
            
            <div className="relative space-y-8 before:absolute before:left-8 before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-white/10">
              {advice.roadmap?.map((step, i) => (
                <div 
                  key={i}
                  className="relative pl-20"
                >
                  <div className="absolute left-0 top-0 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-brand-600 text-xl font-black text-white shadow-xl dark:border-slate-950">
                    {i + 1}
                  </div>
                  <div className="rounded-[2rem] border border-slate-900/10 bg-white p-8 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <h4 className="text-xl font-black text-slate-950 dark:text-white">{step.step}</h4>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        step.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700' :
                        step.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {step.difficulty} Effort
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{step.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CareerAdvisor;