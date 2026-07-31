import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AlertCircle, Search, Mail, CheckCircle, RefreshCw } from 'lucide-react';
import { L } from '../../lib/i18n';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: number;
  status: 'unread' | 'read' | 'replied';
}

export default function AdminContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);
  const [error, setError] = useState('');

  const fetchMessages = async () => {
    setLoading(true);
    setError('');
    try {
      const q = query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ContactMessage)));
    } catch (e) {
      console.error(e);
      setError('মেসেজগুলো লোড করা যায়নি। আবার চেষ্টা করুন।');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMessages(); }, []);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'contactMessages', id), { status: 'read' });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'read' } : m));
    } catch (e) {
      console.error(e);
      setError('মেসেজের অবস্থা পরিবর্তন করা যায়নি।');
    }
  };

  const markAsReplied = async (id: string) => {
    try {
      await updateDoc(doc(db, 'contactMessages', id), { status: 'replied' });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'replied' } : m));
    } catch (e) {
      console.error(e);
      setError('মেসেজের অবস্থা পরিবর্তন করা যায়নি।');
    }
  };

  const filtered = messages.filter(m => {
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.subject?.toLowerCase().includes(q) || m.message?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const unreadCount = messages.filter(m => m.status === 'unread').length;
  const statusLabels: Record<string, string> = {
    all: 'সব',
    unread: 'নতুন',
    read: 'পড়া হয়েছে',
    replied: 'উত্তর দেওয়া',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-1">{L.messages}</h2>
      <p className="text-xs text-slate-400">{L.messagesHelp}</p>
      {error && <div className="flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
          <div className="text-2xl font-bold text-white">{messages.length}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">মোট মেসেজ</div>
        </div>
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
          <div className="text-2xl font-bold text-[#F59E0B]">{unreadCount}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">নতুন</div>
        </div>
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
          <div className="text-2xl font-bold text-[#2563EB]">{messages.filter(m => m.status === 'read').length}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">পড়া হয়েছে</div>
        </div>
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
          <div className="text-2xl font-bold text-[#10B981]">{messages.filter(m => m.status === 'replied').length}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">উত্তর দেওয়া</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {['all', 'unread', 'read', 'replied'].map(s => (
            <button type="button" key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === s ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
              }`}>
              {statusLabels[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={fetchMessages} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-400 hover:text-white" title="আবার লোড করুন">
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="নাম, ইমেইল বা বিষয় দিয়ে খুঁজুন…"
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center">
          <Mail className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">কোনো মেসেজ নেই</h3>
          <p className="text-slate-400 text-sm">{messages.length === 0 ? 'এখনও কোনো যোগাযোগের মেসেজ আসেনি।' : 'এই খোঁজ বা বাছাইয়ের সঙ্গে কোনো মেসেজ মেলেনি।'}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(msg => (
            <div key={msg.id}
              className={`bg-white/5 backdrop-blur-xl rounded-2xl p-5 border cursor-pointer transition-all hover:bg-white/10 ${
                msg.status === 'unread' ? 'border-[#F59E0B]/30' : 'border-white/10'
              }`}
              onClick={() => { setSelectedMsg(selectedMsg?.id === msg.id ? null : msg); if (msg.status === 'unread') markAsRead(msg.id); }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.status === 'unread' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                    msg.status === 'replied' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-bold text-white text-sm truncate">{msg.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        msg.status === 'unread' ? 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' :
                        msg.status === 'replied' ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30' : 'text-blue-400 bg-blue-500/10 border-blue-400/30'
                      }`}>
                        {statusLabels[msg.status]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{msg.subject} — {msg.email}{msg.phone ? ` · ${msg.phone}` : ''}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{new Date(msg.createdAt).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {msg.status !== 'replied' && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); markAsReplied(msg.id); }}
                      className="p-1.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/20 transition-all" title="উত্তর দেওয়া হয়েছে হিসেবে চিহ্নিত করুন">
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {/* Expanded Message */}
              {selectedMsg?.id === msg.id && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-500">
                    <span>{msg.email}</span>
                    {msg.phone && <span>· {msg.phone}</span>}
                    <span>· {msg.subject}</span>
                  </div>
                  <div className="mt-3">
                    <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:text-blue-400">
                      <Mail className="h-3.5 w-3.5" /> ইমেইলে উত্তর দিন
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
