import React, { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Edit2,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import type { MainCategory, SubCategory } from '../../lib/types';
import { UploadField } from '../../lib/upload';

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#0B1220] px-4 py-3 text-sm text-white outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 placeholder:text-slate-600';

const colorOptions = [
  { value: 'text-[#F59E0B]', label: 'হলুদ' },
  { value: 'text-[#2563EB]', label: 'নীল' },
  { value: 'text-[#10B981]', label: 'সবুজ' },
  { value: 'text-purple-400', label: 'বেগুনি' },
  { value: 'text-rose-400', label: 'গোলাপি' },
];

const contentCollections = ['courses', 'books', 'articles', 'exams'] as const;

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-white">{label}</span>
      {children}
      {helper && <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">{helper}</span>}
    </label>
  );
}

export default function AdminCategories() {
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingMain, setEditingMain] = useState(false);
  const [mainId, setMainId] = useState<string | null>(null);
  const [mainForm, setMainForm] = useState({
    title: '',
    description: '',
    color: colorOptions[0].value,
    coverImage: '',
    order: 1,
  });
  const [mainCustomId, setMainCustomId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingSub, setEditingSub] = useState(false);
  const [subId, setSubId] = useState<string | null>(null);
  const [subForm, setSubForm] = useState({ title: '', description: '', parentMainCategory: '' });
  const [expandedMain, setExpandedMain] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      const [mainSnapshot, subSnapshot] = await Promise.all([
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'subcategories')),
      ]);
      setMainCategories(
        (mainSnapshot.docs.map(item => ({ id: item.id, ...item.data() })) as MainCategory[])
          .sort((a, b) => (a.order || 0) - (b.order || 0)),
      );
      setSubCategories(
        (subSnapshot.docs.map(item => ({ id: item.id, ...item.data() })) as SubCategory[])
          .sort((a, b) => (a.order || 0) - (b.order || 0)),
      );
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'বিভাগের তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getContentRecords = async () => {
    const snapshots = await Promise.all(contentCollections.map(name => getDocs(collection(db, name))));
    return snapshots.flatMap((snapshot, index) => snapshot.docs.map(item => ({
      collectionName: contentCollections[index],
      id: item.id,
      data: item.data() as Record<string, unknown>,
    })));
  };

  const resetMainForm = () => {
    setEditingMain(false);
    setMainId(null);
    setMainCustomId('');
    setShowAdvanced(false);
    setMainForm({
      title: '',
      description: '',
      color: colorOptions[0].value,
      coverImage: '',
      order: mainCategories.length + 1,
    });
  };

  const resetSubForm = () => {
    setEditingSub(false);
    setSubId(null);
    setSubForm({ title: '', description: '', parentMainCategory: '' });
  };

  const openNewMain = () => {
    resetMainForm();
    setMessage(null);
    setEditingMain(true);
  };

  const handleMainSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const duplicate = mainCategories.some(item =>
      item.id !== mainId && item.title.trim().toLowerCase() === mainForm.title.trim().toLowerCase());
    if (duplicate) {
      setMessage({ type: 'error', text: 'এই নামে একটি বিভাগ আগে থেকেই আছে। অন্য নাম দিন।' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const value = {
        ...mainForm,
        title: mainForm.title.trim(),
        description: mainForm.description.trim(),
        order: Number(mainForm.order),
      };
      if (mainId) {
        const previous = mainCategories.find(item => item.id === mainId);
        if (previous && previous.title !== value.title) {
          const records = await getContentRecords();
          const affectedContent = records.filter(item =>
            item.data.mainCategory === previous.title || item.data.category === previous.title);
          const affectedSubcategories = subCategories.filter(item => item.parentMainCategory === previous.title && item.id);
          if (affectedContent.length + affectedSubcategories.length + 1 > 450) {
            setMessage({ type: 'error', text: 'এই বিভাগের সঙ্গে অনেক কনটেন্ট যুক্ত আছে। নাম বদলাতে সহায়তা নিন।' });
            return;
          }
          const batch = writeBatch(db);
          batch.update(doc(db, 'categories', mainId), value);
          affectedSubcategories.forEach(item => {
            batch.update(doc(db, 'subcategories', item.id!), { parentMainCategory: value.title });
          });
          affectedContent.forEach(item => {
            batch.update(doc(db, item.collectionName, item.id), {
              category: value.title,
              mainCategory: value.title,
            });
          });
          await batch.commit();
        } else {
          await updateDoc(doc(db, 'categories', mainId), value);
        }
      } else if (mainCustomId.trim()) {
        await setDoc(doc(db, 'categories', mainCustomId.trim()), value);
      } else {
        await addDoc(collection(db, 'categories'), value);
      }
      await fetchData();
      resetMainForm();
      setMessage({ type: 'success', text: 'মূল বিভাগটি সফলভাবে সেভ হয়েছে।' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'বিভাগটি সেভ করা যায়নি। তথ্যগুলো দেখে আবার চেষ্টা করুন।' });
    } finally {
      setSaving(false);
    }
  };

  const handleMainDelete = async (category: MainCategory) => {
    if (!category.id) return;
    const related = subCategories.filter(item => item.parentMainCategory === category.title);
    const prompt = related.length
      ? `“${category.title}” মুছে দিলে এর ${related.length}টি উপবিভাগও মুছে যাবে। নিশ্চিত?`
      : `“${category.title}” বিভাগটি মুছে ফেলবেন?`;
    if (!confirm(prompt)) return;

    setSaving(true);
    setMessage(null);
    try {
      const contentRecords = await getContentRecords();
      const usedBy = contentRecords.filter(item =>
        item.data.mainCategory === category.title || item.data.category === category.title);
      if (usedBy.length) {
        setMessage({
          type: 'error',
          text: `এই বিভাগটি ${usedBy.length}টি Course, Book, Article বা Exam-এ ব্যবহার হচ্ছে। আগে সেগুলোর বিভাগ বদলান, তারপর মুছুন।`,
        });
        return;
      }
      await Promise.all([
        ...related.filter(item => item.id).map(item => deleteDoc(doc(db, 'subcategories', item.id!))),
        deleteDoc(doc(db, 'categories', category.id)),
      ]);
      await fetchData();
      setMessage({ type: 'success', text: 'বিভাগটি মুছে ফেলা হয়েছে।' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'বিভাগটি মুছতে সমস্যা হয়েছে। এতে ব্যবহৃত কনটেন্ট থাকলে আগে সেগুলোর বিভাগ বদলান।' });
    } finally {
      setSaving(false);
    }
  };

  const openAddSub = (mainTitle: string) => {
    setMessage(null);
    setEditingSub(true);
    setSubId(null);
    setSubForm({ title: '', description: '', parentMainCategory: mainTitle });
  };

  const handleSubSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const duplicate = subCategories.some(item =>
      item.id !== subId
      && item.parentMainCategory === subForm.parentMainCategory
      && item.title.trim().toLowerCase() === subForm.title.trim().toLowerCase());
    if (duplicate) {
      setMessage({ type: 'error', text: 'এই মূল বিভাগের ভেতরে একই নামের উপবিভাগ আগে থেকেই আছে।' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const value = {
        title: subForm.title.trim(),
        description: subForm.description.trim(),
        parentMainCategory: subForm.parentMainCategory,
      };
      if (subId) {
        const previous = subCategories.find(item => item.id === subId);
        if (previous && (previous.title !== value.title || previous.parentMainCategory !== value.parentMainCategory)) {
          const records = await getContentRecords();
          const affectedContent = records.filter(item =>
            item.data.subCategory === previous.title
            && (item.data.mainCategory === previous.parentMainCategory || item.data.category === previous.parentMainCategory));
          if (affectedContent.length + 1 > 450) {
            setMessage({ type: 'error', text: 'এই উপবিভাগের সঙ্গে অনেক কনটেন্ট যুক্ত আছে। নাম বদলাতে সহায়তা নিন।' });
            return;
          }
          const batch = writeBatch(db);
          batch.update(doc(db, 'subcategories', subId), value);
          affectedContent.forEach(item => {
            batch.update(doc(db, item.collectionName, item.id), {
              category: value.parentMainCategory,
              mainCategory: value.parentMainCategory,
              subCategory: value.title,
            });
          });
          await batch.commit();
        } else {
          await updateDoc(doc(db, 'subcategories', subId), value);
        }
      } else {
        await addDoc(collection(db, 'subcategories'), value);
      }
      await fetchData();
      resetSubForm();
      setMessage({ type: 'success', text: 'উপবিভাগটি সফলভাবে সেভ হয়েছে।' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'উপবিভাগটি সেভ করা যায়নি। আবার চেষ্টা করুন।' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubEdit = (sub: SubCategory) => {
    setSubForm({
      title: sub.title,
      description: sub.description || '',
      parentMainCategory: sub.parentMainCategory || '',
    });
    setSubId(sub.id || null);
    setMessage(null);
    setEditingSub(true);
  };

  const handleSubDelete = async (sub: SubCategory) => {
    if (!sub.id || !confirm(`“${sub.title}” উপবিভাগটি মুছে ফেলবেন?`)) return;
    setSaving(true);
    setMessage(null);
    try {
      const contentRecords = await getContentRecords();
      const usedBy = contentRecords.filter(item =>
        item.data.subCategory === sub.title
        && (item.data.mainCategory === sub.parentMainCategory || item.data.category === sub.parentMainCategory));
      if (usedBy.length) {
        setMessage({
          type: 'error',
          text: `এই উপবিভাগটি ${usedBy.length}টি কনটেন্টে ব্যবহার হচ্ছে। আগে কনটেন্টগুলোর উপবিভাগ বদলান, তারপর মুছুন।`,
        });
        return;
      }
      await deleteDoc(doc(db, 'subcategories', sub.id));
      await fetchData();
      setMessage({ type: 'success', text: 'উপবিভাগটি মুছে ফেলা হয়েছে।' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'উপবিভাগটি মুছতে সমস্যা হয়েছে। এতে ব্যবহৃত কনটেন্ট থাকলে আগে সেগুলোর বিভাগ বদলান।' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-slate-300"><Loader2 className="h-4 w-4 animate-spin" /> বিভাগগুলো লোড হচ্ছে…</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">কনটেন্টের বিভাগ</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
            মূল বিভাগ হলো বড় বিষয়, আর উপবিভাগ হলো তার ভেতরের ছোট বিষয়। এগুলো Course, Book ও Article ফর্মে বাছাই করা যায়।
          </p>
        </div>
        <button type="button" onClick={openNewMain} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500">
          <Plus className="h-4 w-4" /> নতুন মূল বিভাগ
        </button>
      </div>

      {message && (
        <div className={`mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm ${message.type === 'success' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-rose-400/20 bg-rose-500/10 text-rose-200'}`}>
          {message.type === 'success' && <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {editingMain && (
        <form onSubmit={handleMainSubmit} className="mb-8 space-y-5 rounded-2xl border border-blue-400/20 bg-white/5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white">{mainId ? 'মূল বিভাগ এডিট করুন' : 'নতুন মূল বিভাগ'}</h3>
              <p className="mt-1 text-xs text-slate-400">তারকা (*) দেওয়া তথ্য অবশ্যই পূরণ করুন।</p>
            </div>
            <button type="button" onClick={resetMainForm} aria-label="বন্ধ করুন" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="বিভাগের নাম *" helper="যেমন: Academic Maths বা Olympiad">
              <input required value={mainForm.title} onChange={event => setMainForm({ ...mainForm, title: event.target.value })} className={inputClass} placeholder="বিভাগের নাম লিখুন" />
            </Field>
            <Field label="কোন রঙে দেখাবে?">
              <select value={mainForm.color} onChange={event => setMainForm({ ...mainForm, color: event.target.value })} className={inputClass}>
                {colorOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="এক লাইনের পরিচিতি *" helper="ভিজিটর যেন বিভাগটি কী নিয়ে তা দ্রুত বুঝতে পারে।">
            <input required value={mainForm.description} onChange={event => setMainForm({ ...mainForm, description: event.target.value })} className={inputClass} placeholder="সংক্ষিপ্ত পরিচিতি লিখুন" />
          </Field>
          <UploadField
            label="বিভাগের কভার ছবি"
            value={mainForm.coverImage}
            onChange={coverImage => setMainForm({ ...mainForm, coverImage })}
            folder="category-covers"
          />
          <Field label="কত নম্বরে দেখাবে?" helper="১ দিলে সবার আগে, ২ দিলে তার পরে দেখাবে।">
            <input type="number" min={1} value={mainForm.order} onChange={event => setMainForm({ ...mainForm, order: Number(event.target.value) })} className={inputClass} />
          </Field>
          {!mainId && (
            <div>
              <button type="button" onClick={() => setShowAdvanced(value => !value)} className="text-xs font-bold text-slate-400 hover:text-white">
                {showAdvanced ? 'উন্নত অপশন লুকান' : 'উন্নত অপশন'}
              </button>
              {showAdvanced && (
                <div className="mt-3">
                  <Field label="Custom ID" helper="সাধারণত এটি খালি রাখাই ভালো।">
                    <input value={mainCustomId} onChange={event => setMainCustomId(event.target.value)} className={inputClass} placeholder="শুধু ইংরেজি অক্ষর, সংখ্যা, - বা _" />
                  </Field>
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-3 pt-1">
            <button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} সেভ করুন
            </button>
            <button type="button" onClick={resetMainForm} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5">বাতিল</button>
          </div>
        </form>
      )}

      {editingSub && (
        <form onSubmit={handleSubSubmit} className="mb-8 space-y-5 rounded-2xl border border-indigo-400/20 bg-white/5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white">{subId ? 'উপবিভাগ এডিট করুন' : 'নতুন উপবিভাগ'}</h3>
              <p className="mt-1 text-xs text-slate-400">কোন মূল বিভাগের নিচে এটি থাকবে, সেটি নিশ্চিত করুন।</p>
            </div>
            <button type="button" onClick={resetSubForm} aria-label="বন্ধ করুন" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="উপবিভাগের নাম *">
              <input required value={subForm.title} onChange={event => setSubForm({ ...subForm, title: event.target.value })} className={inputClass} placeholder="যেমন: SSC Mathematics" />
            </Field>
            <Field label="কোন মূল বিভাগের নিচে? *">
              <select required value={subForm.parentMainCategory} onChange={event => setSubForm({ ...subForm, parentMainCategory: event.target.value })} className={inputClass}>
                <option value="">বেছে নিন</option>
                {mainCategories.map(item => <option key={item.id} value={item.title}>{item.title}</option>)}
              </select>
            </Field>
          </div>
          <Field label="ছোট পরিচিতি" helper="না চাইলে খালি রাখতে পারেন।">
            <input value={subForm.description} onChange={event => setSubForm({ ...subForm, description: event.target.value })} className={inputClass} placeholder="উপবিভাগটি কী নিয়ে?" />
          </Field>
          <div className="flex flex-wrap gap-3">
            <button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} সেভ করুন
            </button>
            <button type="button" onClick={resetSubForm} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5">বাতিল</button>
          </div>
        </form>
      )}

      {mainCategories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center">
          <p className="font-bold text-white">এখনও কোনো বিভাগ তৈরি হয়নি</p>
          <p className="mt-2 text-sm text-slate-400">প্রথমে একটি মূল বিভাগ তৈরি করুন, তারপর তার ভেতরে উপবিভাগ যোগ করুন।</p>
          <button type="button" onClick={openNewMain} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">
            <Plus className="h-4 w-4" /> প্রথম বিভাগ তৈরি করুন
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {mainCategories.map(main => {
            const subs = subCategories.filter(item => item.parentMainCategory === main.title);
            const isExpanded = expandedMain === main.id;
            return (
              <div key={main.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <button type="button" onClick={() => setExpandedMain(isExpanded ? null : main.id || null)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    {isExpanded ? <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" /> : <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-black ${main.color || 'text-white'}`}>{main.title}</span>
                        <span className="rounded-full bg-black/30 px-2 py-0.5 text-[11px] text-slate-400">{subs.length}টি উপবিভাগ</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-400">{main.description}</p>
                    </div>
                  </button>
                  <div className="flex gap-2 self-end sm:self-auto">
                    <button type="button" onClick={() => {
                      setEditingMain(true);
                      setMainId(main.id || null);
                      setMainForm({
                        title: main.title,
                        description: main.description,
                        color: main.color || colorOptions[0].value,
                        coverImage: main.coverImage || '',
                        order: main.order || 1,
                      });
                      setMessage(null);
                    }} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/15 bg-blue-400/10 px-3 py-2 text-xs font-bold text-blue-200">
                      <Edit2 className="h-3.5 w-3.5" /> এডিট
                    </button>
                    <button type="button" onClick={() => handleMainDelete(main)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/15 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-200">
                      <Trash2 className="h-3.5 w-3.5" /> মুছুন
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/10 bg-black/10 p-4 sm:pl-12">
                    {subs.length === 0 && <p className="mb-3 text-sm text-slate-500">এই বিভাগের ভেতরে এখনো কোনো উপবিভাগ নেই।</p>}
                    <div className="space-y-2">
                      {subs.map(sub => (
                        <div key={sub.id} className="flex flex-col gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-bold text-white">{sub.title}</p>
                            {sub.description && <p className="mt-0.5 text-xs text-slate-500">{sub.description}</p>}
                          </div>
                          <div className="flex gap-2 self-end sm:self-auto">
                            <button type="button" onClick={() => handleSubEdit(sub)} aria-label={`${sub.title} এডিট করুন`} className="rounded-lg p-2 text-blue-300 hover:bg-blue-400/10"><Edit2 className="h-4 w-4" /></button>
                            <button type="button" onClick={() => handleSubDelete(sub)} aria-label={`${sub.title} মুছুন`} className="rounded-lg p-2 text-rose-300 hover:bg-rose-400/10"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => openAddSub(main.title)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-300 hover:text-indigo-200">
                      <Plus className="h-4 w-4" /> এই বিভাগে উপবিভাগ যোগ করুন
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
