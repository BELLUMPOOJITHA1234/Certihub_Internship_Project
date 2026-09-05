import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Plus, ShieldCheck, Award } from 'lucide-react';
import axios from 'axios';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import BatchImageIssueModal from '../components/modals/BatchImageIssueModal';
import ForcedUsernameModal from '../components/modals/ForcedUsernameModal';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } } };

const InstitutionDashboard = () => {
  const [hods, setHods] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', department: '' });
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/institution/departments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!cancelled) setHods(res.data);
      } catch {
        toast.error("Failed to fetch HODs");
      }
    };
    init();
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const docSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (docSnap.exists()) {
          setDbUser(docSnap.data());
        }
      }
    });
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  const handleCreateHOD = async (e) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser?.getIdToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/api/institution/create-hod`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`HOD account created for ${formData.name}`);
      setShowAddModal(false);
      setFormData({ name: '', email: '', department: '' });
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/institution/departments`, {
        headers: { Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` }
      });
      setHods(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Creation failed");
    }
  };


  return (
    <motion.div className="max-w-7xl mx-auto px-6 py-10" variants={stagger} initial="hidden" animate="visible">
      <motion.div variants={fadeUp} className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white">Institution Hub</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your academic departments and issue credentials.</p>
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
            onClick={() => setShowIssueModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 rounded-2xl font-bold transition hover:bg-brand-100"
          >
            <Award className="w-5 h-5" /> Issue Credential
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition"
          >
            <Plus className="w-5 h-5" /> Add New HOD
          </button>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card p-8 rounded-[2.5rem]">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl dark:bg-indigo-900/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-950 dark:text-white">{hods.length}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Departments</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 card p-8 rounded-[2.5rem]">
        <h2 className="text-2xl font-black text-slate-950 dark:text-white mb-8">Department Heads</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 text-xs font-black uppercase tracking-widest text-slate-400">
                <th className="pb-4">Name</th>
                <th className="pb-4">Department</th>
                <th className="pb-4">Email</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {hods.map((hod) => (
                <tr key={hod.id} className="border-b border-slate-50 dark:border-white/5 last:border-0">
                  <td className="py-4 font-bold text-slate-900 dark:text-white">{hod.name}</td>
                  <td className="py-4">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-lg text-xs font-black text-slate-600 dark:text-slate-400">
                      {hod.department}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-slate-500">{hod.email}</td>
                  <td className="py-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-teal-600">
                      <ShieldCheck className="w-3.5 h-3.5" /> ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-2xl font-black text-slate-950 dark:text-white mb-6">Provision New HOD</h3>
            <form onSubmit={handleCreateHOD} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Full Name</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-brand-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Institutional Email</label>
                <input 
                  type="email" required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-brand-500 outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Department</label>
                <input 
                  type="text" required
                  placeholder="e.g. Computer Science"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-brand-500 outline-none"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showIssueModal && (
        <BatchImageIssueModal 
          onClose={() => setShowIssueModal(false)} 
          defaultDomain={user?.email ? user.email.split('@')[1] : ''}
        />
      )}
      
      <ForcedUsernameModal 
        dbUser={dbUser} 
        user={user} 
        onUsernameSet={(newUsername) => setDbUser({ ...dbUser, username: newUsername })} 
      />
    </motion.div>
  );
};

export default InstitutionDashboard;