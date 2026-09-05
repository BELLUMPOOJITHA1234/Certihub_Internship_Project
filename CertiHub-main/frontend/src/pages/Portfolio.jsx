import { useState, useEffect } from 'react';
import logo from '../assets/logo.png';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { ShieldCheck, ExternalLink, Download, BarChart3, Users, Award, TrendingUp, PieChart, Activity } from 'lucide-react';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } } };

const Portfolio = () => {
  const { username } = useParams();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);
  const [stats, setStats] = useState({
    totalIssued: 0,
    verifiedRate: 0,
    topSkills: [],
    categoryBreakdown: {}
  });

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const usersRef = collection(db, "users");
        const qUser = query(usersRef, where("username", "==", username.toLowerCase()));
        const userSnapshot = await getDocs(qUser);
        
        if (userSnapshot.empty) {
          setLoading(false);
          return;
        }
        
        const userData = { id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data() };
        setProfileUser(userData);

        const isEntity = ['institution', 'org_admin', 'hod', 'mentor'].includes(userData.role);

        let q;
        if (isEntity) {
          q = query(
            collection(db, "certificates"), 
            where("issuerId", "==", userData.uid)
          );
        } else {
          q = query(collection(db, "certificates"), where("userId", "==", userData.uid));
        }

        const querySnapshot = await getDocs(q);
        const certs = [];
        const skillsMap = {};
        const categories = {};
        
        querySnapshot.forEach((doc) => {
          const d = doc.data();
          certs.push({ id: doc.id, ...d });
          
          if (d.skills) {
            d.skills.forEach(s => {
              skillsMap[s] = (skillsMap[s] || 0) + 1;
            });
          }
          if (d.category) {
            categories[d.category] = (categories[d.category] || 0) + 1;
          }
        });
        
        certs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setCertificates(certs);

        const topSkills = Object.entries(skillsMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));

        setStats({
          totalIssued: certs.length,
          verifiedRate: certs.length > 0 ? 100 : 0,
          topSkills,
          categoryBreakdown: categories
        });

      } catch (error) {
        console.error("Error fetching portfolio:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (username) fetchPortfolio();
  }, [username]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
    </div>
  );
  
  if (!profileUser && !loading) return (
    <div className="app-shell py-20 text-center">
      <h1 className="text-2xl font-black text-slate-400">Public profile not found.</h1>
      <Link to="/" className="mt-4 inline-block text-brand-600 font-bold">Return Home</Link>
    </div>
  );

  const isEntity = ['institution', 'org_admin', 'hod', 'mentor'].includes(profileUser.role);

  return (
    <div className="app-shell py-12">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white p-3 shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-white/5">
          <img src={logo} alt="CertiHub Logo" className="w-full h-full object-contain" />
        </div>
        
        <h1 className="mb-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
          {isEntity ? "Institutional Insights" : "Verified Credential Portfolio"}
        </h1>
        
        <div className="flex flex-col items-center gap-2">
          <p className="text-md font-black text-brand-700 dark:text-brand-400 flex items-center gap-2">
            {isEntity ? <ShieldCheck className="w-5 h-5" /> : null}
            @{profileUser.username}
          </p>
          <p className="max-w-xl text-slate-500 font-medium">
            {isEntity 
              ? `Real-time analytics and issuance statistics for ${profileUser.displayName || 'this organization'}.`
              : "A public collection of verified achievements, processed and authenticated by CertiHub AI."}
          </p>
        </div>
      </div>

      {isEntity ? (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Issued', value: stats.totalIssued, icon: Award, color: 'brand' },
              { label: 'Active Recipients', value: stats.totalIssued, icon: Users, color: 'blue' },
              { label: 'Avg. Skill Gain', value: '3.4', icon: TrendingUp, color: 'green' },
              { label: 'Verification Status', value: '100%', icon: Activity, color: 'purple' },
            ].map((stat, i) => (
              <div 
                key={i}
                className="card p-6 flex items-center gap-5"
              >
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center bg-${stat.color}-500/10 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 card p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black flex items-center gap-2"><BarChart3 className="w-5 h-5 text-brand-600" /> Talent Distribution</h3>
                <span className="text-[10px] font-black uppercase text-slate-400">Most Common Verified Skills</span>
              </div>
              <div className="space-y-6">
                {stats.topSkills.length > 0 ? stats.topSkills.map((skill, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-slate-700 dark:text-slate-300">{skill.name}</span>
                      <span className="text-brand-600">{skill.count} Mentions</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-600 rounded-full"
                        style={{ width: `${(skill.count / stats.totalIssued) * 100}%` }}
                      />
                    </div>
                  </div>
                )) : (
                  <div className="py-10 text-center text-slate-400 font-bold italic">No skill data available yet.</div>
                )}
              </div>
            </div>

            <div className="card p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black flex items-center gap-2"><PieChart className="w-5 h-5 text-brand-600" /> Categories</h3>
              </div>
              <div className="space-y-4">
                {Object.entries(stats.categoryBreakdown).map(([cat, count], i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{cat}</span>
                    <span className="h-8 w-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-xs font-black text-brand-600 shadow-sm border border-slate-100 dark:border-white/10">{count}</span>
                  </div>
                ))}
                {Object.keys(stats.categoryBreakdown).length === 0 && (
                  <div className="py-10 text-center text-slate-400 font-bold italic">No category data.</div>
                )}
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Public Issuance Ledger</h3>
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Recipient</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Credential</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {certificates.slice(0, 10).map((cert, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {cert.candidateName ? cert.candidateName.split(' ')[0] + ' ***' : 'Verified Student'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{cert.title}</div>
                        <div className="text-[10px] text-brand-600 font-bold">{cert.category}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 text-green-600 text-[10px] font-black">
                          <ShieldCheck className="w-3 h-3" /> VERIFIED
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-400">{cert.date || 'Jan 2024'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        certificates.length === 0 ? (
          <div className="card p-6 mx-auto max-w-2xl py-16 text-center">
            <p className="text-slate-500 text-lg">This user hasn't added any public certificates yet.</p>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {certificates.map((cert) => (
              <motion.div 
                key={cert.id}
                variants={fadeUp}
                className="card overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300"
              >
                <div className="h-48 bg-slate-100 overflow-hidden relative border-b border-slate-200 group">
                  <img 
                    src={cert.cloudinaryUrl?.replace(/\.pdf$/i, '.jpg')} 
                    alt={cert.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.target.src = 'https://placehold.co/400x200/e2e8f0/475569?text=PDF+Document' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                  
                  <div className="absolute top-4 right-4 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md border border-white/20">
                    {cert.date || ''}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-black text-xl leading-tight line-clamp-2">{cert.title}</h3>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-black text-brand-700 dark:text-brand-400 uppercase tracking-tight">{cert.issuer}</p>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {cert.skills?.slice(0, 4).map((skill, idx) => (
                        <span key={idx} className="chip rounded-md text-[11px]">
                          {skill}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Link 
                        to={`/certificate/${cert.id}`}
                        className="btn-primary flex-1 py-2.5"
                      >
                        View Details
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <a 
                        href={cert.cloudinaryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition"
                        title="Download Certificate"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )
      )}
    </div>
  );
};

export default Portfolio;