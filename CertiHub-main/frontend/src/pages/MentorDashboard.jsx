import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { auth } from '../firebase/firebase';
import { toast } from 'react-hot-toast';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } } };

const MentorDashboard = () => {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const fetchStudents = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/mentor/students`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!cancelled) setStudents(res.data);
      } catch {
        toast.error("Failed to fetch students");
      }
    };
    fetchStudents();
    return () => { cancelled = true; };
  }, []);

  return (
    <motion.div className="max-w-7xl mx-auto px-6 py-10" variants={stagger} initial="hidden" animate="visible">
      <motion.div variants={fadeUp} className="mb-10">
        <h1 className="text-4xl font-black text-slate-950 dark:text-white">Review Board</h1>
        <p className="text-slate-500 mt-2 font-medium">Verify credentials for your assigned student roster.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="grid md:grid-cols-4 gap-6 mb-12">
        <div className="md:col-span-1 card p-6 rounded-[2rem]">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">My Roster</div>
          <div className="text-3xl font-black text-slate-950 dark:text-white">{students.length}</div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="card p-8 rounded-[2.5rem]">
        <h3 className="text-2xl font-black text-slate-950 dark:text-white mb-8">Assigned Students</h3>
        <div className="space-y-4">
          {students.length > 0 ? students.map(student => (
            <div key={student.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 group hover:border-brand-500/30 transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center font-black dark:bg-brand-900/20">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <div className="font-black text-slate-900 dark:text-white">{student.name}</div>
                  <div className="text-sm text-slate-500">{student.email}</div>
                </div>
              </div>
              <Link 
                to={`/user/${student.username}`}
                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-white/10 text-xs font-black text-slate-700 dark:text-white rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 transition"
              >
                Review Portfolio <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )) : (
            <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">No students assigned to your roster yet.</p>
              <p className="text-slate-500 text-xs mt-1">Contact your HOD to link students to your profile.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MentorDashboard;