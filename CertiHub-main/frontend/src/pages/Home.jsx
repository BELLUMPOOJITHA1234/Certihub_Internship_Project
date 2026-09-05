import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, BadgeCheck, BarChart3, BookOpenCheck, BrainCircuit, FileCheck2,
  FileSearch, Globe2, GraduationCap, LockKeyhole, MousePointer2, ScanLine,
  ShieldCheck, Sparkles, Target, TrendingUp, UploadCloud, Zap, Users, Award,
} from 'lucide-react';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

const Home = () => {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="absolute inset-0 hero-grid opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgb(var(--app-bg))]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-brand-400/10 blur-[120px]" />

        <div className="app-shell relative z-10 py-28 lg:py-36">
          <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <motion.div variants={stagger} initial="hidden" animate="visible">
              <motion.div variants={fadeUp} className="eyebrow mb-5">
                <Sparkles className="h-3.5 w-3.5" />
                AI-Powered Credential Intelligence
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                Turn certificates into{' '}
                <span className="relative">
                  <span className="relative z-10 bg-gradient-to-r from-brand-600 to-accent-violet bg-clip-text text-transparent">proof</span>
                  <span className="absolute bottom-0.5 left-0 right-0 h-2 bg-brand-200/50 dark:bg-brand-500/20 -rotate-1 rounded-full" />
                </span>{' '}
                people can trust.
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">
                CertiHub transforms certificate PDFs and images into a verified skills portfolio with AI extraction, career readiness insights, and a clean public profile.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/login" className="btn-primary px-7 py-3 text-sm">
                  Build your portfolio <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Verify Credential ID..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value) {
                        window.location.href = `/verify/${e.target.value}`;
                      }
                    }}
                    className="btn-secondary px-7 py-3 text-sm w-full sm:w-64 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">
                    <ScanLine className="h-4 w-4" />
                  </div>
                </div>
              </motion.div>
              <motion.div variants={fadeUp} className="mt-10 flex items-center gap-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-1.5">
                    {['bg-brand-500', 'bg-accent-emerald', 'bg-accent-violet', 'bg-accent-amber'].map((c, i) => (
                      <div key={i} className={`h-7 w-7 rounded-full ${c} border-2 border-white dark:border-slate-950 flex items-center justify-center text-white text-[10px] font-bold`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">2,400+</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Verified professionals</div>
                  </div>
                </div>
                <div className="h-7 w-px bg-slate-200 dark:bg-white/10" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">99.4%</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">AI accuracy</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Mock UI */}
            <motion.div variants={scaleIn} initial="hidden" animate="visible" className="relative">
              <div className="rounded-2xl border border-slate-200/60 bg-white p-2.5 shadow-float dark:border-white/[0.08] dark:bg-slate-900">
                <div className="overflow-hidden rounded-xl bg-slate-950 text-white">
                  <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    <span className="h-2 w-2 rounded-full bg-amber-300" />
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">CertiHub Console</span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-400">Live Credential Profile</p>
                        <h2 className="mt-1 text-lg font-bold">Professional Skill Passport</h2>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verified
                      </div>
                    </div>
                    <div className="grid lg:grid-cols-[1fr_1fr] gap-0">
                      <div className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r lg:border-white/10">
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white">
                              <FileCheck2 className="h-5 w-5" />
                            </div>
                            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-300">PDF</span>
                          </div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Uploaded Certificate</p>
                          <h3 className="mt-1 text-base font-bold">Advanced Web Development</h3>
                          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">Issuer, skills, date, and summary extracted into structured proof.</p>
                          <div className="mt-3 flex flex-wrap gap-1">
                            {['React', 'Cloud', 'APIs', 'Security'].map((s) => (
                              <span key={s} className="rounded-md bg-white/[0.08] px-2 py-1 text-[10px] font-semibold text-slate-300">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="p-4 space-y-2.5">
                        <Signal icon={<ScanLine className="h-3.5 w-3.5" />} title="OCR extraction" value="Completed" tone="text-brand-300" />
                        <Signal icon={<BadgeCheck className="h-3.5 w-3.5" />} title="Skill proof" value="Verified" tone="text-emerald-300" />
                        <Signal icon={<Target className="h-3.5 w-3.5" />} title="Best role fit" value="Software Developer" tone="text-brand-300" />
                        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
                          <div className="mb-2.5 flex items-center justify-between">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Job Score</p>
                            <p className="text-xs font-bold text-emerald-300">86%</p>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-emerald-400 via-brand-400 to-accent-violet" />
                          </div>
                          <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">Add one cloud certificate to strengthen deployment readiness.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -bottom-3 left-3 hidden rounded-xl border border-slate-200/60 bg-white px-3 py-2.5 shadow-card dark:border-white/[0.08] dark:bg-slate-900 sm:flex items-center gap-2.5 animate-float-gentle">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <MousePointer2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">One-link portfolio</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Ready for recruiters</p>
                </div>
              </div>
              <div className="absolute -top-3 right-3 hidden rounded-xl border border-slate-200/60 bg-white px-3 py-2.5 shadow-card dark:border-white/[0.08] dark:bg-slate-900 sm:flex items-center gap-2.5 animate-float-gentle" style={{ animationDelay: '1s' }}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">AI Analysis</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Instant extraction</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-10 border-y border-slate-200/60 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.02]">
        <div className="app-shell">
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
            {[
              { icon: <Users className="h-4 w-4" />, value: '2,400+', label: 'Professionals' },
              { icon: <Award className="h-4 w-4" />, value: '8,500+', label: 'Certificates' },
              { icon: <ShieldCheck className="h-4 w-4" />, value: '99.4%', label: 'Accuracy' },
              { icon: <Globe2 className="h-4 w-4" />, value: '50+', label: 'Countries' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="text-brand-500 dark:text-brand-400">{stat.icon}</div>
                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">{stat.value}</div>
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28">
        <div className="app-shell">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="mb-14 max-w-2xl">
            <motion.div variants={fadeUp} className="eyebrow mb-4">How it works</motion.div>
            <motion.h2 variants={fadeUp} className="section-title">From upload to verified proof in seconds.</motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-base text-slate-600 dark:text-slate-400">
              Our AI engine reads your certificates, extracts verified data, and builds a professional profile you can share anywhere.
            </motion.p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <UploadCloud className="h-6 w-6" />, title: 'Upload', desc: 'Add certificate PDFs or images from courses, internships, and achievements.', color: 'from-brand-500 to-brand-600' },
              { icon: <FileSearch className="h-6 w-6" />, title: 'Extract', desc: 'AI reads title, issuer, dates, names, and skills with 99%+ accuracy.', color: 'from-accent-emerald to-emerald-600' },
              { icon: <BrainCircuit className="h-6 w-6" />, title: 'Understand', desc: 'Generate summaries, role suggestions, and career readiness insights.', color: 'from-accent-violet to-violet-600' },
              { icon: <Globe2 className="h-6 w-6" />, title: 'Share', desc: 'Publish a clean portfolio URL for recruiters and mentors to scan.', color: 'from-accent-amber to-amber-600' },
            ].map((f, i) => (
              <motion.article key={i} variants={fadeUp} className="group card p-6 cursor-pointer hover:shadow-card-hover">
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-sm transition-transform duration-200 group-hover:scale-105`}>
                  {f.icon}
                </div>
                <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{f.desc}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 lg:py-28 bg-white dark:bg-slate-950">
        <div className="app-shell">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
              <motion.div variants={fadeUp} className="eyebrow mb-4">Dashboard</motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                A dashboard that explains achievement, not just stores uploads.
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-400">
                Every certificate becomes a structured record with skill tags, AI summaries, portfolio score, and role guidance.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-7 grid grid-cols-2 gap-3">
                <div className="card p-4">
                  <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                    <ScanLine className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Read certificates</h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Convert images and PDFs into useful data.</p>
                </div>
                <div className="card p-4">
                  <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Measure readiness</h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">See how your portfolio aligns with goals.</p>
                </div>
              </motion.div>
            </motion.div>
            <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
              <div className="rounded-2xl border border-slate-200/60 bg-white p-2.5 shadow-float dark:border-white/[0.08] dark:bg-slate-900">
                <div className="overflow-hidden rounded-xl bg-slate-50 p-5 dark:bg-slate-950">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">My Workspace</h3>
                    <div className="flex gap-1.5">
                      {['All', 'Verified', 'Personal'].map((t, i) => (
                        <span key={t} className={`px-2.5 py-1 rounded-md text-[10px] font-semibold ${i === 0 ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500'}`}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[1,2,3].map((i) => (
                      <div key={i} className="rounded-xl border border-slate-200/60 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] p-2.5">
                        <div className="h-16 rounded-lg bg-slate-100 dark:bg-white/[0.06] mb-2.5" />
                        <div className="h-2.5 w-3/4 rounded bg-slate-200 dark:bg-white/10 mb-1.5" />
                        <div className="h-2 w-1/2 rounded bg-slate-100 dark:bg-white/[0.06]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 lg:py-28">
        <div className="app-shell">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-14">
            <motion.div variants={fadeUp} className="eyebrow mb-4 mx-auto w-fit">Built for everyone</motion.div>
            <motion.h2 variants={fadeUp} className="section-title">One platform, every career stage.</motion.h2>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="grid gap-5 md:grid-cols-3">
            {[
              { icon: <GraduationCap className="h-5 w-5" />, title: 'For students', desc: 'Show learning outcomes with organized certificate proof and clear skill highlights.', gradient: 'from-brand-500 to-brand-600' },
              { icon: <TrendingUp className="h-5 w-5" />, title: 'For job seekers', desc: 'Turn certificates into a recruiter-friendly profile with summaries and role fit.', gradient: 'from-accent-emerald to-emerald-600' },
              { icon: <BookOpenCheck className="h-5 w-5" />, title: 'For upskilling', desc: 'Find what to learn next based on your current certificate portfolio.', gradient: 'from-accent-violet to-violet-600' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="card p-6 group cursor-pointer hover:shadow-card-hover">
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-sm transition-transform duration-200 group-hover:scale-105`}>
                  {item.icon}
                </div>
                <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="app-shell">
          <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950 p-8 sm:p-14 text-white">
            <div className="absolute inset-0 hero-grid opacity-15" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-brand-500/15 blur-[100px]" />
            <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                  <LockKeyhole className="h-6 w-6" />
                </div>
                <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                  Stop sending plain certificate files. Share proof that explains itself.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300">
                  Build a CertiHub portfolio and make every certificate easier to trust, understand, and use.
                </p>
              </div>
              <Link to="/login" className="btn-primary bg-white px-8 py-3.5 text-sm text-brand-700 hover:bg-slate-100 shrink-0">
                Start now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const Signal = ({ icon, title, value, tone }) => (
  <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-3">
    <div className="flex items-center gap-2 text-slate-300">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.08]">{icon}</span>
      <span className="text-xs font-medium">{title}</span>
    </div>
    <span className={`text-right text-xs font-semibold ${tone}`}>{value}</span>
  </div>
);

export default Home;
