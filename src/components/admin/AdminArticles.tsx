import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { CheckCircle, Edit2, FileText, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import { MAIN_CATEGORIES_DATA } from '../../lib/data';
import { UploadField } from '../../lib/upload';
import type { Article, MainCategory, SubCategory } from '../../lib/types';

const emptyForm = { title: '', description: '', content: '', mainCategory: '', subCategory: '', image: '' };
const inputClass = 'w-full rounded-xl border border-white/10 bg-[#0B1220] px-4 py-3 text-sm text-white outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 placeholder:text-slate-600';

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold text-white">{label}</span>{children}{helper && <span className="mt-1.5 block text-xs text-slate-400">{helper}</span>}</label>;
}

export default function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      const [articleSnapshot, categorySnapshot, subcategorySnapshot] = await Promise.all([
        getDocs(collection(db, 'articles')),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'subcategories')),
      ]);
      setArticles(articleSnapshot.docs.map(item => ({ id: item.id, ...item.data() })) as Article[]);
      setMainCategories(categorySnapshot.docs.map(item => ({ id: item.id, ...item.data() })) as MainCategory[]);
      setSubCategories(subcategorySnapshot.docs.map(item => ({ id: item.id, ...item.data() })) as SubCategory[]);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'আর্টিকেলের তথ্য লোড করা যায়নি।' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchData(); }, []);

  const categoryOptions = useMemo(() => mainCategories.length
    ? mainCategories
    : MAIN_CATEGORIES_DATA.map((item, index) => ({ id: `default-${index}`, title: item.title, description: item.description })), [mainCategories]);
  const subcategoryOptions = useMemo(() => {
    const stored = subCategories.filter(item => item.parentMainCategory === form.mainCategory);
    if (stored.length) return stored;
    const fallback = MAIN_CATEGORIES_DATA.find(item => item.title === form.mainCategory);
    return (fallback?.subCategories || []).map((title, index) => ({ id: `default-${index}`, title, parentMainCategory: form.mainCategory }));
  }, [form.mainCategory, subCategories]);

  const openNew = () => {
    setForm(emptyForm);
    setCurrentId(null);
    setMessage(null);
    setIsEditing(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.mainCategory) {
      setMessage({ type: 'error', text: 'একটি Main Category বেছে নিন।' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const value = { ...form, category: form.mainCategory };
      if (currentId) await updateDoc(doc(db, 'articles', currentId), value);
      else await addDoc(collection(db, 'articles'), value);
      await fetchData();
      setIsEditing(false);
      setForm(emptyForm);
      setCurrentId(null);
      setMessage({ type: 'success', text: 'আর্টিকেলটি সফলভাবে সেভ হয়েছে।' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'আর্টিকেলটি সেভ করা যায়নি।' });
    } finally {
      setSaving(false);
    }
  };

  const editArticle = (article: Article) => {
    setForm({
      title: article.title,
      description: article.description,
      content: article.content || '',
      mainCategory: article.mainCategory || article.category,
      subCategory: article.subCategory || '',
      image: article.image || '',
    });
    setCurrentId(article.id);
    setMessage(null);
    setIsEditing(true);
  };

  const removeArticle = async (article: Article) => {
    if (!window.confirm(`“${article.title}” আর্টিকেলটি মুছে ফেলবেন?`)) return;
    try {
      await deleteDoc(doc(db, 'articles', article.id));
      await fetchData();
      setMessage({ type: 'success', text: 'আর্টিকেলটি মুছে ফেলা হয়েছে।' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'আর্টিকেলটি মুছে ফেলা যায়নি।' });
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-[#2563EB]" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-2xl font-extrabold">{isEditing ? (currentId ? 'আর্টিকেল পরিবর্তন করুন' : 'নতুন আর্টিকেল লিখুন') : 'সব আর্টিকেল'}</h2><p className="mt-1 text-sm text-slate-400">{articles.length}টি লেখা আছে। Blog, notice বা শিক্ষামূলক লেখা এখান থেকে প্রকাশ করুন।</p></div>
        {!isEditing && <button type="button" onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-bold hover:bg-blue-500"><Plus className="h-4 w-4" /> নতুন আর্টিকেল</button>}
      </div>

      {message && <div role="status" className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/20 bg-rose-400/10 text-rose-200'}`}>{message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}{message.text}</div>}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7">
          <Field label="শিরোনাম *" helper="পাঠক প্রথমে এই লেখাটি দেখবে।"><input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="আর্টিকেলের স্পষ্ট শিরোনাম" className={inputClass} /></Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Main Category *"><select required value={form.mainCategory} onChange={event => setForm({ ...form, mainCategory: event.target.value, subCategory: '' })} className={inputClass}><option value="">বেছে নিন</option>{categoryOptions.map(item => <option key={item.id} value={item.title}>{item.title}</option>)}</select></Field>
            <Field label="Subcategory"><select value={form.subCategory} onChange={event => setForm({ ...form, subCategory: event.target.value })} className={inputClass}><option value="">প্রয়োজন না হলে খালি রাখুন</option>{subcategoryOptions.map(item => <option key={item.id} value={item.title}>{item.title}</option>)}</select></Field>
          </div>
          <UploadField label="Cover image" value={form.image} onChange={value => setForm({ ...form, image: value })} folder="article-images" />
          <Field label="ছোট পরিচিতি *" helper="Article card-এ ২–৩ লাইনে দেখাবে।"><textarea required rows={3} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className={inputClass} /></Field>
          <Field label="পুরো লেখা *" helper="Paragraph আলাদা করতে একটি খালি লাইন দিন।"><textarea required rows={14} value={form.content} onChange={event => setForm({ ...form, content: event.target.value })} className={inputClass} /></Field>
          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => { setIsEditing(false); setForm(emptyForm); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold hover:bg-white/10"><X className="h-4 w-4" /> বাতিল</button>
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-bold hover:bg-blue-500 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'সেভ হচ্ছে…' : 'আর্টিকেল সেভ করুন'}</button>
          </div>
        </form>
      ) : articles.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center"><FileText className="mx-auto h-10 w-10 text-slate-500" /><h3 className="mt-4 text-lg font-extrabold">এখনো কোনো আর্টিকেল নেই</h3><button type="button" onClick={openNew} className="mt-5 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-bold">প্রথম আর্টিকেল লিখুন</button></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="min-w-[720px] w-full text-left text-sm"><thead className="bg-black/20 text-xs uppercase tracking-wider text-slate-400"><tr><th className="p-4">শিরোনাম</th><th className="p-4">বিভাগ</th><th className="p-4">পরিচিতি</th><th className="p-4 text-right">কাজ</th></tr></thead>
            <tbody>{articles.map(article => <tr key={article.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"><td className="p-4 font-bold">{article.title}</td><td className="p-4 text-slate-300">{article.mainCategory || article.category}<div className="text-xs text-slate-500">{article.subCategory || '—'}</div></td><td className="max-w-sm p-4 text-slate-400"><span className="line-clamp-2">{article.description}</span></td><td className="p-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => editArticle(article)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/15 bg-blue-400/10 px-3 py-2 text-xs font-bold text-blue-200"><Edit2 className="h-3.5 w-3.5" /> এডিট</button><button type="button" onClick={() => removeArticle(article)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/15 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-200"><Trash2 className="h-3.5 w-3.5" /> মুছুন</button></div></td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
