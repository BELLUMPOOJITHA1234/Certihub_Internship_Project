import { useState, useEffect, useRef } from 'react';
import { Sparkles, AtSign, CheckCircle2, XCircle } from 'lucide-react';
import { db } from '../../firebase/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const ForcedUsernameModal = ({ dbUser, user, onUsernameSet }) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const prevStatusRef = useRef('');

  useEffect(() => {
    let newStatus = '';
    if (dbUser && !dbUser.username && usernameInput.trim()) {
      if (/^[a-zA-Z0-9_]{3,}$/.test(usernameInput)) {
        newStatus = 'checking';
      } else {
        newStatus = 'invalid';
      }
    }

    if (newStatus !== prevStatusRef.current && newStatus !== 'checking') {
      setUsernameStatus(newStatus);
    }
    prevStatusRef.current = newStatus;

    if (newStatus !== 'checking') return;

    const timer = setTimeout(async () => {
      try {
        const q = query(collection(db, "users"), where("username", "==", usernameInput.trim().toLowerCase()));
        const snapshot = await getDocs(q);
        const result = snapshot.empty ? 'available' : 'taken';
        if (prevStatusRef.current === 'checking') {
          setUsernameStatus(result);
        }
      } catch (err) {
        console.error("Error checking username:", err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [usernameInput, dbUser]);

  const handleSaveUsername = async () => {
    if (usernameStatus !== 'available' || !user) return;
    setUsernameSaving(true);
    try {
      const newUsername = usernameInput.trim().toLowerCase();
      await updateDoc(doc(db, "users", user.uid), {
        username: newUsername
      });
      toast.success("Username claimed successfully!");
      if (onUsernameSet) {
        onUsernameSet(newUsername);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to claim username.");
    } finally {
      setUsernameSaving(false);
    }
  };

  if (!dbUser || dbUser.username) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden p-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-brand-50 dark:bg-brand-500/10 text-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-950 dark:text-white mb-2">Claim your username</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">This will be your unique identifier on CertiHub.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="field-label dark:text-slate-300">Username</label>
            <div className="relative">
              <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                className={`w-full bg-slate-50 dark:bg-slate-900 border ${usernameStatus === 'available' ? 'border-emerald-400 focus:ring-emerald-500/10' : usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-400 focus:ring-red-500/10' : 'border-slate-200 dark:border-slate-800'} rounded-xl py-3 pl-12 pr-12 text-slate-900 dark:text-white outline-none focus:ring-2`}
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="your_handle"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {usernameStatus === 'checking' && <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />}
                {usernameStatus === 'available' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <XCircle className="h-5 w-5 text-red-500" />}
              </div>
            </div>
            {usernameStatus === 'taken' && <p className="mt-2 text-xs font-bold text-red-500">This username is already taken.</p>}
            {usernameStatus === 'invalid' && <p className="mt-2 text-xs font-bold text-red-500">At least 3 characters, no special symbols.</p>}
            {usernameStatus === 'available' && <p className="mt-2 text-xs font-bold text-emerald-600">Username is available!</p>}
          </div>

          <button 
            onClick={handleSaveUsername}
            disabled={usernameStatus !== 'available' || usernameSaving}
            className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {usernameSaving ? "Saving..." : "Claim Username"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForcedUsernameModal;