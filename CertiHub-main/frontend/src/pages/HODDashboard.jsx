import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Link2, ShieldCheck, Award } from 'lucide-react';
import axios from 'axios';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import BatchImageIssueModal from '../components/modals/BatchImageIssueModal';
import ForcedUsernameModal from '../components/modals/ForcedUsernameModal';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } } };

const HODDashboard = () => {
  const [mentors, setMentors] = useState([]);
  const [showAddMentor, setShowAddMentor] = useState(false);
  const [showLinkStudent, setShowLinkStudent] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [mentorData, setMentorData] = useState({ name: '', email: '' });
  const [linkData, setLinkData] = useState({ studentEmail: '', mentorId: '' });
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
        if (!cancelled) setMentors(res.data.filter(u => u.role === 'mentor'));
      } catch (err) {
        console.error(err);
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

  const handleCreateMentor = async (e) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser?.getIdToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/api/hod/create-mentor`, mentorData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Mentor account created for ${mentorData.name}`);
      setShowAddMentor(false);
      setMentorData({ name: '', email: '' });
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/institution/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMentors(res.data.filter(u => u.role === 'mentor'));
    } catch (err) {
      toast.error(err.response?.data?.error || "Creation failed");
    }
  };

  const handleLinkStudent = async (e) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser?.getIdToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/api/hod/link-student`, linkData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Student linked successfully");
      setShowLinkStudent(false);
      setLinkData({ studentEmail: '', mentorId: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || "Linking failed");
    }
  };

  return (
    <motion.div className="max-w-7xl mx-auto px-6 py-10" variants={stagger} initial="hidden" animate="visible">
      <motion.div variants={fadeUp} className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white">Department Matrix</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage faculty delegation and mentorship links.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowIssueModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 rounded-2xl font-bold transition hover:bg-brand-100"
          >
            <Award className="w-5 h-5" /> Issue Credential
          </button>
          <button 
            onClick={() => setShowLinkStudent(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition dark:bg-white/5 dark:border-white/10 dark:text-white"
          >
            <Link2 className="w-5 h-5" /> Link Student
          </button>
          <button 
            onClick={() => setShowAddMentor(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold shadow-lg hover:bg-brand-700 transition"
          >
            <UserPlus className="w-5 h-5" /> Add Mentor
          </button>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 mt-12">
        <div className="card p-8 rounded-[2.5rem]">
          <h3 className="text-2xl font-black text-slate-950 dark:text-white mb-6">Faculty Mentors</h3>
          <p className="text-slate-400 mb-8 text-sm font-bold uppercase tracking-widest">Authorized reviewers in your domain</p>
          
          <div className="space-y-4">
            {mentors.length > 0 ? mentors.map(mentor => (
              <div key={mentor.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{mentor.name}</div>
                  <div className="text-xs text-slate-500">{mentor.email}</div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-teal-600">
                   <ShieldCheck className="w-4 h-4" /> VERIFIED
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-slate-400 font-medium bg-slate-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10">
                No mentors provisioned yet.
              </div>
            )}
          </div>
        </div>

        <div className="card p-8 rounded-[2.5rem] bg-gradient-to-br from-brand-600 to-indigo-700 text-white border-0">
          <ShieldCheck className="w-12 h-12 mb-6 opacity-80" />
          <h3 className="text-3xl font-black mb-4">Verification Chain</h3>
          <p className="text-brand-100 font-medium leading-relaxed mb-8">
            As HOD, you control the trust of your department. Mentors assigned here will have the authority to verify student credentials on behalf of the institution.
          </p>
          <div className="p-6 bg-white/10 rounded-2xl border border-white/10">
            <div className="text-xs font-black uppercase tracking-widest mb-2">Audit Status</div>
            <div className="text-xl font-bold">Compliant</div>
          </div>
        </div>
      </div>

      {showAddMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-2xl font-black text-slate-950 dark:text-white mb-6">Add Faculty Mentor</h3>
            <form onSubmit={handleCreateMentor} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Name</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-brand-500"
                  value={mentorData.name}
                  onChange={(e) => setMentorData({...mentorData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Institutional Email</label>
                <input 
                  type="email" required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-brand-500"
                  value={mentorData.email}
                  onChange={(e) => setMentorData({...mentorData, email: e.target.value})}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddMentor(false)} className="flex-1 font-bold text-slate-500">Cancel</button>
                <button type="submit" className="flex-1 bg-brand-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-brand-500/20">Add Mentor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLinkStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-2xl font-black text-slate-950 dark:text-white mb-6">Link Student to Mentor</h3>
            <form onSubmit={handleLinkStudent} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Student Email</label>
                <input 
                  type="email" required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-brand-500"
                  value={linkData.studentEmail}
                  onChange={(e) => setLinkData({...linkData, studentEmail: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Select Mentor</label>
                <select 
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-brand-500"
                  value={linkData.mentorId}
                  onChange={(e) => setLinkData({...linkData, mentorId: e.target.value})}
                >
                  <option value="">Choose a mentor...</option>
                  {mentors.map(m => <option key={m.id} value={m.uid}>{m.name}</option>)}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowLinkStudent(false)} className="flex-1 font-bold text-slate-500">Cancel</button>
                <button type="submit" className="flex-1 bg-brand-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-brand-500/20">Establish Link</button>
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

export default HODDashboard;