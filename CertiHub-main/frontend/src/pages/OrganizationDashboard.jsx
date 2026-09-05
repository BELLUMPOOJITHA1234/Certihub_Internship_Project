import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, CheckCircle2, Sparkles } from 'lucide-react';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import SmartBatchIssueModal from '../components/modals/SmartBatchIssueModal';
import ForcedUsernameModal from '../components/modals/ForcedUsernameModal';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } } };

const OrganizationDashboard = () => {
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const docSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (docSnap.exists()) {
          setDbUser(docSnap.data());
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <motion.div className="max-w-7xl mx-auto px-6 py-10" variants={stagger} initial="hidden" animate="visible">
      <motion.div variants={fadeUp} className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white">Organization Hub</h1>
          <p className="text-slate-500 mt-2 font-medium">Issue smart AI-verified credentials to your employees.</p>
        </div>
        <div className="flex gap-4">
          {dbUser?.username && (
            <a 
              href={`/user/${dbUser.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition"
            >
              Public Analytics
            </a>
          )}
          <button 
            onClick={() => setShowSmartModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition"
          >
            <Sparkles className="w-5 h-5" /> Smart Batch Issue
          </button>
        </div>
      </motion.div>

      <motion.div variants={stagger} className="grid md:grid-cols-3 gap-6">
        <motion.div variants={fadeUp} className="card p-8 rounded-[2.5rem]">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl dark:bg-blue-900/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-950 dark:text-white">Active</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Status</div>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={fadeUp} className="card p-8 rounded-[2.5rem]">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl dark:bg-brand-900/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-950 dark:text-white">0</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Issued</div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="card p-8 rounded-[2.5rem]">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl dark:bg-purple-900/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-950 dark:text-white">0</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Employees</div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="mt-12 card p-8 rounded-[2.5rem] bg-gradient-to-br from-brand-600 to-indigo-700 text-white border-0">
        <h2 className="text-3xl font-black mb-4">AI Smart Credentialing</h2>
        <p className="text-brand-100 font-medium leading-relaxed max-w-2xl mb-8">
          Upload certificate files and a simple CSV mapping file. Our AI will automatically analyze the certificates, extract the candidate names, and match them with your CSV to send the credentials to the right employees.
        </p>
        <button 
          onClick={() => setShowSmartModal(true)}
          className="bg-white text-brand-600 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5" /> Start Smart Issuance
        </button>
      </div>

      {showSmartModal && (
        <SmartBatchIssueModal onClose={() => setShowSmartModal(false)} />
      )}

      <ForcedUsernameModal 
        dbUser={dbUser} 
        user={user} 
        onUsernameSet={(newUsername) => setDbUser({ ...dbUser, username: newUsername })} 
      />
    </motion.div>
  );
};

export default OrganizationDashboard;