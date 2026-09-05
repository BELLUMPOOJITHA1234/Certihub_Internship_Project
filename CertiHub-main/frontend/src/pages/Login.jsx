import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth, googleProvider, db } from '../firebase/firebase';
import {
  signInWithRedirect, getRedirectResult, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');
  const navigate = useNavigate();

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const userCredential = await getRedirectResult(auth);
        if (userCredential) {
          let targetPath = '/dashboard';
          if (userCredential.user.email === 'admin@certihub.com') {
            targetPath = '/admin';
          } else {
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
            if (userDoc.exists()) {
              const role = userDoc.data().role || 'student';
              if (role === 'institution') targetPath = '/institution';
              else if (role === 'hod') targetPath = '/hod';
              else if (role === 'mentor') targetPath = '/mentor';
              else if (role === 'org_admin') targetPath = '/organization';
              else if (role === 'employee') targetPath = '/employee';
            } else {
              await setDoc(doc(db, 'users', userCredential.user.uid), {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: userCredential.user.displayName || userCredential.user.email.split('@')[0],
                role: 'student',
                createdAt: new Date().toISOString()
              });
            }
          }
          navigate(targetPath, { replace: true });
        }
      } catch (err) {
        console.error("Redirect error:", err);
        setError(err.message);
      }
    };
    checkRedirect();
  }, []);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        let targetPath = '/dashboard';
        if (user.email === 'admin@certihub.com') {
          targetPath = '/admin';
        } else {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const role = userDoc.data().role || 'student';
            if (role === 'institution') targetPath = '/institution';
            else if (role === 'hod') targetPath = '/hod';
            else if (role === 'mentor') targetPath = '/mentor';
            else if (role === 'org_admin') targetPath = '/organization';
            else if (role === 'employee') targetPath = '/employee';
          } else {
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              role: 'student',
              createdAt: new Date().toISOString()
            });
          }
        }
        navigate(targetPath, { replace: true });
        return;
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: name.trim(),
          role: selectedRole,
          createdAt: new Date().toISOString()
        });
        setSuccess('Account created successfully!');
        let targetPath = '/dashboard';
        if (selectedRole === 'institution') targetPath = '/institution';
        else if (selectedRole === 'hod') targetPath = '/hod';
        else if (selectedRole === 'mentor') targetPath = '/mentor';
        else if (selectedRole === 'org_admin') targetPath = '/organization';
        else if (selectedRole === 'employee') targetPath = '/employee';
        setTimeout(() => navigate(targetPath, { replace: true }), 500);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setSuccess('');
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return setError('Please enter your email first to reset password.');
    setError('');
    setSuccess('');
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset link sent! Check your inbox.');
    } catch (err) {
      setError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="absolute inset-0 hero-grid opacity-20" />
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_30%_10%,rgba(59,130,246,0.1),transparent_32%),radial-gradient(circle_at_70%_0%,rgba(99,102,241,0.1),transparent_34%)]" />

      <div className={`app-shell relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-10 py-10 lg:gap-16 ${isLogin ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
        {/* Left side - value prop */}
        <div className="hidden lg:block lg:w-1/2">
          {isLogin ? (
            <motion.div key="login-left" variants={stagger} initial="hidden" animate="visible">
              <motion.div variants={fadeUp} className="eyebrow mb-5"><ShieldCheck className="h-3.5 w-3.5" /> Welcome back</motion.div>
              <motion.h1 variants={fadeUp} className="max-w-lg text-5xl font-bold tracking-tight text-slate-950 dark:text-white">Continue building your career.</motion.h1>
              <motion.p variants={fadeUp} className="mt-5 max-w-md text-base leading-relaxed text-slate-600 dark:text-slate-400">Sign in to manage your certificates, update your skills, and check your latest career roadmap updates.</motion.p>
              <motion.div variants={fadeUp} className="mt-8 grid max-w-md grid-cols-2 gap-3">
                <ValueTile icon={<Sparkles className="h-4 w-4" />} title="Quick Scan" desc="Update your skills fast." />
                <ValueTile icon={<ShieldCheck className="h-4 w-4" />} title="Secure Storage" desc="Your data stays yours." />
                <ValueTile icon={<LockKeyhole className="h-4 w-4" />} title="Private Links" desc="You control who sees." />
                <ValueTile icon={<Mail className="h-4 w-4" />} title="Updated Profile" desc="Share your latest wins." />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="signup-left" variants={stagger} initial="hidden" animate="visible">
              <motion.div variants={fadeUp} className="eyebrow mb-5"><Sparkles className="h-3.5 w-3.5" /> Join CertiHub</motion.div>
              <motion.h1 variants={fadeUp} className="max-w-lg text-5xl font-bold tracking-tight text-slate-950 dark:text-white">Show the world what you know.</motion.h1>
              <motion.p variants={fadeUp} className="mt-5 max-w-md text-base leading-relaxed text-slate-600 dark:text-slate-400">Create an account to turn your certificates into a professional profile that actually helps you get hired.</motion.p>
              <motion.div variants={fadeUp} className="mt-8 grid max-w-md grid-cols-2 gap-3">
                <ValueTile icon={<UserRound className="h-4 w-4" />} title="Free Profile" desc="No cost to get started." />
                <ValueTile icon={<ShieldCheck className="h-4 w-4" />} title="AI Analysis" desc="Understand your gaps." />
                <ValueTile icon={<Sparkles className="h-4 w-4" />} title="Smart Roadmap" desc="Plan your next step." />
                <ValueTile icon={<Mail className="h-4 w-4" />} title="Personal URL" desc="certihub.com/you" />
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Auth panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} className="mx-auto w-full max-w-[440px] lg:w-1/2">
          <div className="rounded-2xl border border-slate-200/60 bg-white p-7 shadow-card dark:border-white/[0.08] dark:bg-slate-950/90 sm:p-8">
            <div className="mb-6">
              <div className="mb-4 inline-flex rounded-lg border border-slate-200/60 bg-slate-100/80 p-0.5 dark:border-white/[0.06] dark:bg-white/[0.04]">
                <button type="button" onClick={() => setIsLogin(true)} className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${isLogin ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}>
                  Login
                </button>
                <button type="button" onClick={() => setIsLogin(false)} className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${!isLogin ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}>
                  Sign up
                </button>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                {isLogin ? 'Sign in to see your certificates and career help.' : 'Pick a username for your public profile.'}
              </p>
            </div>

            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
            {success && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">{success}</div>}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="field-label">Full Name</label>
                    <div className="relative">
                      <UserRound className="field-icon" />
                      <input type="text" required={!isLogin} className="field-with-icon" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rohit Singh" />
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Account Type</label>
                    <div className="relative">
                      <ShieldCheck className="field-icon" />
                      <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="field-with-icon appearance-none">
                        <option value="student">Student / Professional</option>
                        <option value="institution">Academic Institution</option>
                        <option value="org_admin">Organization / Employer</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="field-label">Email</label>
                <div className="relative">
                  <Mail className="field-icon" />
                  <input type="email" required className="field-with-icon" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                </div>
              </div>
              <div>
                <label className="field-label">Password</label>
                <div className="relative">
                  <LockKeyhole className="field-icon" />
                  <input type={showPassword ? 'text' : 'password'} required className="field-with-icon pr-11" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete={isLogin ? 'current-password' : 'new-password'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {isLogin && (
                  <div className="mt-1.5 flex justify-end">
                    <button type="button" onClick={handleForgotPassword} disabled={resetLoading} className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50">
                      {resetLoading ? 'Sending...' : 'Forgot password?'}
                    </button>
                  </div>
                )}
              </div>
              <button type="submit" className="btn-primary w-full py-3">
                {isLogin ? 'Sign in' : 'Create account'} <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="my-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <div className="h-px bg-slate-200 dark:bg-white/10" />
              <span>or</span>
              <div className="h-px bg-slate-200 dark:bg-white/10" />
            </div>

            <button onClick={handleGoogleAuth} className="btn-secondary w-full py-3">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const ValueTile = ({ icon, title, desc }) => (
  <div className="rounded-xl border border-slate-200/60 bg-white/70 p-3.5 transition-colors duration-150 hover:border-brand-200 dark:border-white/[0.06] dark:bg-white/[0.04] dark:hover:border-brand-500/30">
    <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
      {icon}
    </div>
    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{desc}</p>
  </div>
);

export default Login;
