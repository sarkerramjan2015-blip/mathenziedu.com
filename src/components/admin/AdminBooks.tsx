import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { CheckCircle, Edit2, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import { MAIN_CATEGORIES_DATA } from '../../lib/data';
import { formatCurrency } from '../../lib/media';
import { UploadField } from '../../lib/upload';
import type { Book, MainCategory, SubCategory } from '../../lib/types';

const emptyForm = {
  title: '',
  author: '',
  description: '',
  mainCategory: 'Books Corner',
  subCategory: '',
  classOrLevel: '',
  price: 0,
  isFree: false,
  coverImage: '',
  buyUrl: '',
  downloadUrl: '',
};

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#0B1220] px-4 py-3 text-sm text-white outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 placeholder:text-slate-600';

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold text-white">{label}</span>{children}{helper && <span className="mt-1.5 block text-xs text-slate-400">{helper}</span>}</label>;
}

export default function AdminBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [customId, setCustomId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      const [bookSnapshot, categorySnapshot, subcategorySnapshot] = await Promise.all([
        getDocs(collection(db, 'books')),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'subcategories')),
      ]);
      setBooks(bookSnapshot.docs.map(item => ({ id: item.id, ...item.data() })) as Book[]);
      setMainCategories(categorySnapshot.docs.map(item => ({ id: item.id, ...item.data() })) as MainCategory[]);
      setSubCategories(subcategorySnapshot.docs.map(item => ({ id: item.id, ...item.data() })) as SubCategory[]);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'বইয়ের তথ্য লোড করা যায়নি।' });
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

  const reset = () => {
    setForm(emptyForm);
    setCurrentId(null);
    setCustomId('');
    setShowAdvanced(false);
  };

  const openNew = () => {
    reset();
    setMessage(null);
    setIsEditing(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const value = {
        ...form,
        category: form.mainCategory,
        price: form.isFree ? 0 : Number(form.price),
        createdAt: currentId ? books.find(book => book.id === currentId)?.createdAt || Date.now() : Date.now(),
      };
      if (currentId) await updateDoc(doc(db, 'books', currentId), value);
      else if (customId.trim()) await setDoc(doc(db, 'books', customId.trim()), value);
      else await addDoc(collection(db, 'books'), value);
      await fetchData();
      setIsEditing(false);
      reset();
      setMessage({ type: 'success', text: 'বইটি সফলভাবে সেভ হয়েছে।' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'বইটি সেভ করা যায়নি। তথ্যগুলো পরীক্ষা করুন।' });
    } finally {
      setSaving(false);
    }
  };

  const editBook = (book: Book) => {
    setForm({
      title: book.title,
      author: book.author,
      description: book.description,
      mainCategory: book.mainCategory || book.category || 'Books Corner',
      subCategory: book.subCategory || '',
      classOrLevel: book.classOrLevel || '',
      price: book.price,
      isFree: book.isFree,
      coverImage: book.coverImage || '',
      buyUrl: book.buyUrl || '',
      downloadUrl: book.downloadUrl || '',
    });
    setCurrentId(book.id);
    setMessage(null);
    setIsEditing(true);
  };

  const removeBook = async (book: Book) => {
    if (!window.confirm(`“${book.title}” বইটি মুছে ফেলবেন?`)) return;
    try {
      await deleteDoc(doc(db, 'books', book.id));
      await fetchData();
      setMessage({ type: 'success', text: 'বইটি মুছে ফেলা হয়েছে।' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'বইটি মুছে ফেলা যায়নি।' });
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-purple-400" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-2xl font-extrabold">{isEditing ? (currentId ? 'বই পরিবর্তন করুন' : 'নতুন বই যোগ করুন') : 'সব বই ও PDF'}</h2><p className="mt-1 text-sm text-slate-400">{books.length}টি resource আছে। Free download এবং paid বই—দুটিই manage করা যাবে।</p></div>
        {!isEditing && <button type="button" onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold hover:bg-purple-500"><Plus className="h-4 w-4" /> নতুন বই</button>}
      </div>

      {message && <div role="status" className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/20 bg-rose-400/10 text-rose-200'}`}>{message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}{message.text}</div>}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="বইয়ের নাম *"><input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="বইয়ের পূর্ণ নাম" className={inputClass} /></Field>
            <Field label="লেখক/প্রকাশক *"><input required value={form.author} onChange={event => setForm({ ...form, author: event.target.value })} placeholder="লেখকের নাম" className={inputClass} /></Field>
            <Field label="Main Category"><select value={form.mainCategory} onChange={event => setForm({ ...form, mainCategory: event.target.value, subCategory: '' })} className={inputClass}>{categoryOptions.map(item => <option key={item.id} value={item.title}>{item.title}</option>)}</select></Field>
            <Field label="Subcategory"><select value={form.subCategory} onChange={event => setForm({ ...form, subCategory: event.target.value })} className={inputClass}><option value="">বেছে নিন</option>{subcategoryOptions.map(item => <option key={item.id} value={item.title}>{item.title}</option>)}</select></Field>
            <Field label="Class / Level" helper="যেমন: SSC, HSC, O Level"><input value={form.classOrLevel} onChange={event => setForm({ ...form, classOrLevel: event.target.value })} className={inputClass} /></Field>
            <div className="rounded-xl border border-white/10 bg-black/15 p-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-white">
                <input type="checkbox" checked={form.isFree} onChange={event => setForm({ ...form, isFree: event.target.checked, price: event.target.checked ? 0 : form.price })} className="h-5 w-5 accent-purple-500" />
                এটি Free resource
              </label>
              {!form.isFree && <div className="mt-4"><Field label="মূল্য (৳)"><input min={0} type="number" value={form.price} onChange={event => setForm({ ...form, price: Number(event.target.value) })} className={inputClass} /></Field></div>}
            </div>
            <div className="md:col-span-2"><Field label="বইয়ের পরিচিতি *"><textarea required rows={5} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className={inputClass} /></Field></div>
          </div>

          <UploadField label="Cover image" value={form.coverImage} onChange={value => setForm({ ...form, coverImage: value })} folder="book-covers" />

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Buy link" helper="বাইরের website থেকে কিনতে হলে link দিন; না হলে খালি রাখুন।"><input value={form.buyUrl} onChange={event => setForm({ ...form, buyUrl: event.target.value })} placeholder="https://…" className={inputClass} /></Field>
            <Field label="Download link" helper="Free PDF/resource হলে সরাসরি download link দিন।"><input value={form.downloadUrl} onChange={event => setForm({ ...form, downloadUrl: event.target.value })} placeholder="https://…" className={inputClass} /></Field>
          </div>

          {!currentId && <div><button type="button" onClick={() => setShowAdvanced(value => !value)} className="text-xs font-bold text-slate-400 hover:text-white">{showAdvanced ? 'উন্নত অপশন লুকান' : 'উন্নত অপশন দেখুন'}</button>{showAdvanced && <div className="mt-3 max-w-xl"><Field label="Custom ID" helper="সাধারণত খালি রাখুন।"><input value={customId} onChange={event => setCustomId(event.target.value)} className={inputClass} /></Field></div>}</div>}

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => { setIsEditing(false); reset(); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold hover:bg-white/10"><X className="h-4 w-4" /> বাতিল</button>
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold hover:bg-purple-500 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'সেভ হচ্ছে…' : 'বই সেভ করুন'}</button>
          </div>
        </form>
      ) : books.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center"><BookMarkedPlaceholder /><h3 className="mt-4 text-lg font-extrabold">এখনো কোনো বই নেই</h3><button type="button" onClick={openNew} className="mt-5 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold">প্রথম বই যোগ করুন</button></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-black/20 text-xs uppercase tracking-wider text-slate-400"><tr><th className="p-4">বই</th><th className="p-4">লেখক</th><th className="p-4">বিভাগ</th><th className="p-4">মূল্য</th><th className="p-4 text-right">কাজ</th></tr></thead>
            <tbody>{books.map(book => <tr key={book.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"><td className="p-4 font-bold">{book.title}<div className="mt-1 text-xs font-normal text-slate-500">{book.classOrLevel || 'সব level'}</div></td><td className="p-4 text-slate-300">{book.author}</td><td className="p-4 text-slate-300">{book.subCategory || book.mainCategory}</td><td className="p-4 font-bold">{book.isFree ? <span className="text-emerald-300">ফ্রি</span> : formatCurrency(book.price)}</td><td className="p-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => editBook(book)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/15 bg-blue-400/10 px-3 py-2 text-xs font-bold text-blue-200"><Edit2 className="h-3.5 w-3.5" /> এডিট</button><button type="button" onClick={() => removeBook(book)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/15 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-200"><Trash2 className="h-3.5 w-3.5" /> মুছুন</button></div></td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BookMarkedPlaceholder() {
  return <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-400/10 text-purple-300"><Plus className="h-6 w-6" /></span>;
}
