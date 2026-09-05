import { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import { auth, db } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm CertiBot. I can help you understand your certificates and plan your career. How can I help today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const q = query(collection(db, 'certificates'), where('userId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        const certs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCertificates(certs);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/chat`, {
        messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
        certificates: certificates
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.message }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having a bit of trouble connecting. Try again in a second!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isDismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {isOpen && (
        <div
          className="mb-4 flex h-[600px] w-[450px] flex-col overflow-hidden rounded-[2.5rem] border border-slate-900/10 bg-white shadow-2xl shadow-slate-950/20 dark:border-white/10 dark:bg-slate-900 sm:w-[500px] transition-all duration-300"
        >
          <div className="flex items-center justify-between bg-brand-600 px-6 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black">CertiBot</h3>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-200">
                  <div className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                  Online & Ready
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-xl p-2 hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[85%] gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${m.role === 'user' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                    {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-100 text-slate-800 dark:bg-white/5 dark:text-slate-200 rounded-tl-none'
                  }`}>
                    <div className="markdown-chat">
                      <ReactMarkdown>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl bg-slate-100 px-4 py-3 dark:bg-white/5">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    <span className="text-xs font-bold text-slate-400">CertiBot is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-slate-900/10 p-4 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask CertiBot anything..."
                className="w-full rounded-2xl border border-slate-900/10 bg-white px-5 py-3 pr-12 text-sm font-medium focus:border-brand-500 focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 rounded-xl bg-brand-600 p-2 text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50 transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {!isOpen && (
        <div className="group relative">
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute -left-2 -top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white opacity-0 transition-opacity hover:bg-slate-700 group-hover:opacity-100 dark:bg-white dark:text-slate-900"
            title="Dismiss CertiBot"
          >
            <X className="h-3 w-3" />
          </button>
          
          <button
            onClick={() => setIsOpen(true)}
            className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white shadow-2xl shadow-brand-600/40 transition-all hover:-translate-y-1 hover:rotate-5 active:scale-95"
          >
          <div className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-teal-400 text-[10px] font-black text-slate-950 border-2 border-white dark:border-slate-900">
            1
          </div>

          <div className="relative">
            <Bot className="h-8 w-8 transition-transform group-hover:scale-110" />
            
            <div className="absolute left-1.5 top-2.5 h-1 w-1 rounded-full bg-teal-300 opacity-0 group-hover:opacity-100 group-hover:animate-pulse" />
            <div className="absolute right-1.5 top-2.5 h-1 w-1 rounded-full bg-teal-300 opacity-0 group-hover:opacity-100 group-hover:animate-pulse" />
          </div>

          <div className="absolute inset-0 -z-10 rounded-2xl bg-brand-500/20 blur-xl transition-opacity opacity-0 group-hover:opacity-100" />
        </button>
        </div>
      )}
    </div>
  );
};

export default ChatBot;