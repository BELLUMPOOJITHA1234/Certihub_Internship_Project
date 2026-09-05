import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/firebase';
import { deleteUser, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Trash2, User, AlertTriangle, Edit2, Check, X } from 'lucide-react';
import { doc, getDoc, deleteDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

const Settings = () => {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('');
  const [usernameMsg, setUsernameMsg] = useState('');
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameMsg, setNameMsg] = useState('');
  
  const [deleteMsg, setDeleteMsg] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);
      
      try {
        const docSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setDbUser(userData);
          setUsernameInput(userData.username || '');
          setNameInput(userData.displayName || '');
        }
      } catch (error) {
        console.error("Error fetching user data", error);
      } finally {
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!isEditingUsername || usernameInput === dbUser?.username || !usernameInput.trim()) {
      const timer = setTimeout(() => setUsernameStatus(''), 0);
      return () => clearTimeout(timer);
    }

    if (!/^[a-zA-Z0-9_]{3,}$/.test(usernameInput)) {
      const timer = setTimeout(() => setUsernameStatus('invalid'), 0);
      return () => clearTimeout(timer);
    }

    const checkingTimer = setTimeout(() => setUsernameStatus('checking'), 0);
    const timer = setTimeout(async () => {
      try {
        const q = query(collection(db, "users"), where("username", "==", usernameInput.trim().toLowerCase()));
        const snapshot = await getDocs(q);
        setUsernameStatus(snapshot.empty ? 'available' : 'taken');
      } catch (err) {
        console.error("Error checking username:", err);
      }
    }, 500);

    return () => {
      clearTimeout(checkingTimer);
      clearTimeout(timer);
    };
  }, [usernameInput, isEditingUsername, dbUser]);

  const handleUpdateUsername = async () => {
    if (usernameStatus !== 'available') return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        username: usernameInput.trim().toLowerCase()
      });
      setDbUser({ ...dbUser, username: usernameInput.trim().toLowerCase() });
      setIsEditingUsername(false);
      setUsernameMsg('Username updated successfully!');
      setTimeout(() => setUsernameMsg(''), 3000);
    } catch (error) {
      setUsernameMsg('Error updating username: ' + error.message);
    }
  };

  const handleUpdateName = async () => {
    if (!nameInput.trim()) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: nameInput.trim()
      });
      setDbUser({ ...dbUser, displayName: nameInput.trim() });
      setIsEditingName(false);
      setNameMsg('Name updated successfully!');
      setTimeout(() => setNameMsg(''), 3000);
    } catch (error) {
      setNameMsg('Error updating name: ' + error.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone and all your certificates will be lost.")) {
      return;
    }
    
    try {
      const q = query(collection(db, "certificates"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const deletePromises = [];
      querySnapshot.forEach((document) => {
        deletePromises.push(deleteDoc(doc(db, "certificates", document.id)));
      });
      await Promise.all(deletePromises);
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      navigate('/');
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        setDeleteMsg('For security reasons, please log out and log back in to delete your account.');
      } else {
        setDeleteMsg(error.message);
      }
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-500">Loading settings...</div>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-8 h-8 text-brand-600" />
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Account Settings</h1>
      </div>

      <div className="space-y-8">
        <div className="card p-8">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4 dark:border-white/10">
            <User className="w-5 h-5 text-slate-500" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Profile Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="field-label">Email Address</label>
              <div className="field disabled:bg-slate-100 flex items-center h-12">
                {user?.email}
              </div>
            </div>

            <div>
              <label className="field-label">Full Name</label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  disabled={!isEditingName}
                  className="field flex-1"
                  value={isEditingName ? nameInput : (dbUser?.displayName || "Not set")}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your full name"
                />
                
                {!isEditingName ? (
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-200 hover:text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button 
                      onClick={handleUpdateName}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white hover:bg-brand-700"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => { setIsEditingName(false); setNameInput(dbUser?.displayName || ''); }}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              {nameMsg && <p className="mt-2 text-sm text-green-600 font-medium">{nameMsg}</p>}
            </div>
            <div>
              <label className="field-label">Public Username</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    disabled={!isEditingUsername}
                    className={`field pr-12 ${
                      !isEditingUsername ? '' : 
                      usernameStatus === 'available' ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/10' :
                      usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' :
                      ''
                    }`}
                    value={isEditingUsername ? usernameInput : `@${dbUser?.username || "Not set"}`}
                    onChange={(e) => setUsernameInput(e.target.value)}
                  />
                  {isEditingUsername && (
                    <div className="absolute right-3 top-3.5">
                      {usernameStatus === 'checking' && <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>}
                      {usernameStatus === 'available' && <Check className="w-5 h-5 text-green-500" />}
                      {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <X className="w-5 h-5 text-red-500" />}
                    </div>
                  )}
                </div>
                
                {!isEditingUsername ? (
                  <button 
                    onClick={() => setIsEditingUsername(true)}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-200 hover:text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button 
                      onClick={handleUpdateUsername}
                      disabled={usernameStatus !== 'available'}
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${usernameStatus === 'available' ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-white/5'}`}
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => { setIsEditingUsername(false); setUsernameInput(dbUser?.username || ''); }}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              {usernameMsg && <p className="mt-2 text-sm text-green-600 font-medium">{usernameMsg}</p>}
              {isEditingUsername && usernameStatus === 'taken' && <p className="mt-1 text-xs text-red-500">This username is already taken</p>}
              {isEditingUsername && usernameStatus === 'invalid' && <p className="mt-1 text-xs text-red-500">At least 3 characters, no special symbols</p>}
            </div>
          </div>
        </div>

        <div className="card p-8 border border-red-100 dark:border-red-500/20">
          <div className="flex items-center gap-2 mb-6 border-b border-red-50 pb-4 dark:border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold text-red-600">Danger Zone</h2>
          </div>
          
          {deleteMsg && <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg mb-4">{deleteMsg}</div>}
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-slate-800 font-bold mb-1 dark:text-white">Delete Account</h3>
              <p className="text-slate-500 text-sm max-w-md dark:text-slate-400">
                Permanently delete your account and all your data. This action cannot be undone.
              </p>
            </div>
            <button 
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 py-2 px-6 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-600 hover:text-white hover:border-red-600 transition shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;