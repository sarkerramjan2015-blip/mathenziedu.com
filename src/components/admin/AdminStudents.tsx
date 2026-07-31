import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Pencil,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';

interface StudentRecord {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: 'student' | 'admin';
}

const demoUsers: StudentRecord[] = [
  { id: 'demo-admin', userId: 'demo-admin', email: 'admin@mathemzi.demo', displayName: 'Demo Admin', role: 'admin' },
  { id: 'demo-student-1', userId: 'demo-student-1', email: 'student1@example.com', displayName: 'Rahim Ahmed', role: 'student' },
  { id: 'demo-student-2', userId: 'demo-student-2', email: 'student2@example.com', displayName: 'Nusrat Jahan', role: 'student' },
];

export default function AdminStudents() {
  const { user, isDemo } = useAuth();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'admin'>('all');
  const [editing, setEditing] = useState<StudentRecord | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isDemo) {
      setStudents(demoUsers);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      snapshot => {
        const items = snapshot.docs
          .map(item => {
            const data = item.data();
            return {
              id: item.id,
              userId: String(data.userId || item.id),
              email: String(data.email || ''),
              displayName: String(data.displayName || ''),
              role: data.role === 'admin' ? 'admin' : 'student',
            } as StudentRecord;
          })
          .sort((a, b) => (a.displayName || a.email).localeCompare(b.displayName || b.email));
        setStudents(items);
        setLoading(false);
      },
      error => {
        console.error(error);
        setMessage({ type: 'error', text: 'শিক্ষার্থীদের তালিকা দেখা যাচ্ছে না। আপনার Admin permission পরীক্ষা করুন।' });
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [isDemo]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter(student => {
      const matchesRole = roleFilter === 'all' || student.role === roleFilter;
      const matchesSearch = !term || `${student.displayName} ${student.email}`.toLowerCase().includes(term);
      return matchesRole && matchesSearch;
    });
  }, [roleFilter, search, students]);

  const admins = students.filter(student => student.role === 'admin').length;

  const startEditing = (student: StudentRecord) => {
    setEditing(student);
    setDisplayName(student.displayName);
    setRole(student.role);
    setMessage(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!displayName.trim()) {
      setMessage({ type: 'error', text: 'নাম খালি রাখা যাবে না।' });
      return;
    }
    if (editing.userId === user?.uid && editing.role === 'admin' && role === 'student') {
      setMessage({ type: 'error', text: 'নিজের Admin access বন্ধ করা যাবে না। অন্য Admin দিয়ে এই পরিবর্তন করতে হবে।' });
      return;
    }
    if (editing.role !== role && !window.confirm(role === 'admin'
      ? `${editing.email}–কে Admin access দেবেন?`
      : `${editing.email}–এর Admin access বন্ধ করবেন?`)) {
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      if (isDemo) {
        setStudents(items => items.map(item => item.id === editing.id ? { ...item, displayName: displayName.trim(), role } : item));
      } else {
        await updateDoc(doc(db, 'users', editing.id), {
          displayName: displayName.trim(),
          role,
        });
      }
      setMessage({ type: 'success', text: 'ব্যবহারকারীর তথ্য সফলভাবে আপডেট হয়েছে।' });
      setEditing(null);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'তথ্য সেভ করা যায়নি। আবার চেষ্টা করুন।' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <Users className="mb-3 h-5 w-5 text-blue-300" />
          <div className="text-2xl font-extrabold text-white">{students.length}</div>
          <div className="text-xs text-slate-400">মোট অ্যাকাউন্ট</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <UserRound className="mb-3 h-5 w-5 text-emerald-300" />
          <div className="text-2xl font-extrabold text-white">{students.length - admins}</div>
          <div className="text-xs text-slate-400">শিক্ষার্থী</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <ShieldCheck className="mb-3 h-5 w-5 text-amber-300" />
          <div className="text-2xl font-extrabold text-white">{admins}</div>
          <div className="text-xs text-slate-400">Admin</div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-400/15 bg-blue-400/5 px-4 py-3 text-sm leading-relaxed text-blue-100">
        এখান থেকেই নাম ঠিক করা এবং Admin access দেওয়া/বন্ধ করা যাবে। Firebase Console-এ যাওয়ার প্রয়োজন নেই।
      </div>

      {message && (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
              : 'border-rose-400/20 bg-rose-400/10 text-rose-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="mt-0.5 h-4 w-4" /> : <AlertCircle className="mt-0.5 h-4 w-4" />}
          {message.text}
        </div>
      )}

      {editing && (
        <div className="rounded-2xl border border-[#2563EB]/30 bg-[#172554]/45 p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-white">ব্যবহারকারীর তথ্য পরিবর্তন</h3>
              <p className="mt-1 text-xs text-slate-300">{editing.email}</p>
            </div>
            <button type="button" onClick={() => setEditing(null)} aria-label="Close editor" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
            <label>
              <span className="mb-1.5 block text-sm font-bold text-white">নাম</span>
              <input value={displayName} onChange={event => setDisplayName(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0B1220] px-4 py-3 text-sm text-white outline-none focus:border-[#2563EB]" />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-bold text-white">ব্যবহারের অনুমতি</span>
              <select value={role} onChange={event => setRole(event.target.value as 'student' | 'admin')}
                className="w-full rounded-xl border border-white/10 bg-[#0B1220] px-4 py-3 text-sm text-white outline-none focus:border-[#2563EB]">
                <option value="student">শিক্ষার্থী — শুধু শেখার সুবিধা</option>
                <option value="admin">Admin — সবকিছু এডিট করতে পারবে</option>
              </select>
            </label>
            <button type="button" onClick={handleSave} disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              পরিবর্তন সেভ করুন
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <span className="sr-only">নাম বা ইমেইল দিয়ে খুঁজুন</span>
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="নাম বা ইমেইল দিয়ে খুঁজুন…"
            className="w-full rounded-xl border border-white/10 bg-[#0B1220] py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-[#2563EB]" />
        </label>
        <select value={roleFilter} onChange={event => setRoleFilter(event.target.value as typeof roleFilter)}
          className="rounded-xl border border-white/10 bg-[#0B1220] px-4 py-2.5 text-sm text-white outline-none">
          <option value="all">সবাই</option>
          <option value="student">শুধু শিক্ষার্থী</option>
          <option value="admin">শুধু Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-[#2563EB]" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-14 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-slate-500" />
          <h3 className="font-bold text-white">কোনো ব্যবহারকারী পাওয়া যায়নি</h3>
          <p className="mt-1 text-sm text-slate-400">খোঁজার শব্দ বা বাছাই পরিবর্তন করে দেখুন।</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="hidden grid-cols-[1.1fr_1.2fr_140px_90px] gap-4 border-b border-white/10 bg-black/20 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 md:grid">
            <span>নাম</span><span>ইমেইল</span><span>অনুমতি</span><span className="text-right">কাজ</span>
          </div>
          {filtered.map(student => (
            <div key={student.id} className="grid gap-3 border-b border-white/5 px-5 py-4 last:border-0 md:grid-cols-[1.1fr_1.2fr_140px_90px] md:items-center md:gap-4">
              <div>
                <div className="font-bold text-white">{student.displayName || 'নাম দেওয়া হয়নি'}</div>
                {student.userId === user?.uid && <span className="text-[10px] font-bold text-blue-300">আপনার অ্যাকাউন্ট</span>}
              </div>
              <div className="break-all text-sm text-slate-400">{student.email}</div>
              <div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
                  student.role === 'admin'
                    ? 'border-amber-400/20 bg-amber-400/10 text-amber-200'
                    : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                }`}>
                  {student.role === 'admin' ? 'Admin' : 'Student'}
                </span>
              </div>
              <div className="md:text-right">
                <button type="button" onClick={() => startEditing(student)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">
                  <Pencil className="h-3.5 w-3.5" /> এডিট
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
