import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { CheckCircle, Edit2, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import { MAIN_CATEGORIES_DATA } from '../../lib/data';
import { formatCurrency } from '../../lib/media';
import { UploadField } from '../../lib/upload';
import type { Course, MainCategory, SubCategory } from '../../lib/types';

interface CourseForm {
  title: string;
  description: string;
  mainCategory: string;
  subCategory: string;
  instructor: string;
  price: number;
  rating: number;
  lessons: number;
  duration: string;
  level: string;
  image: string;
  outcomes: string[];
  curriculum: Array<{ title: string; lessons: number; time: string }>;
}

const emptyForm: CourseForm = {
  title: '',
  description: '',
  mainCategory: '',
  subCategory: '',
  instructor: '',
  price: 0,
  rating: 0,
  lessons: 0,
  duration: '',
  level: 'Beginner',
  image: '',
  outcomes: [],
  curriculum: [],
};

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#0B1220] px-4 py-3 text-sm text-white outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 placeholder:text-slate-600';

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-white">{label}</span>
      {children}
      {helper && <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">{helper}</span>}
    </label>
  );
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [customId, setCustomId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<CourseForm>(emptyForm);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      const [courseSnapshot, categorySnapshot, subcategorySnapshot] = await Promise.all([
        getDocs(collection(db, 'courses')),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'subcategories')),
      ]);
      setCourses(courseSnapshot.docs.map(item => ({ id: item.id, ...item.data() })) as Course[]);
      setMainCategories(categorySnapshot.docs.map(item => ({ id: item.id, ...item.data() })) as MainCategory[]);
      setSubCategories(subcategorySnapshot.docs.map(item => ({ id: item.id, ...item.data() })) as SubCategory[]);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'কোর্সের তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const categoryOptions = useMemo(() => {
    if (mainCategories.length) return mainCategories;
    return MAIN_CATEGORIES_DATA.map((item, index) => ({ id: `default-${index}`, title: item.title, description: item.description }));
  }, [mainCategories]);

  const subcategoryOptions = useMemo(() => {
    const stored = subCategories.filter(item => item.parentMainCategory === form.mainCategory);
    if (stored.length) return stored;
    const fallback = MAIN_CATEGORIES_DATA.find(item => item.title === form.mainCategory);
    return (fallback?.subCategories || []).map((title, index) => ({ id: `default-sub-${index}`, title, parentMainCategory: form.mainCategory }));
  }, [form.mainCategory, subCategories]);

  const resetForm = () => {
    setForm(emptyForm);
    setCurrentId(null);
    setCustomId('');
    setShowAdvanced(false);
  };

  const openNew = () => {
    resetForm();
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
      const value = {
        ...form,
        category: form.mainCategory,
        price: Number(form.price),
        rating: Number(form.rating),
        lessons: Number(form.lessons),
        outcomes: form.outcomes.filter(Boolean),
        curriculum: form.curriculum.filter(item => item.title.trim()).map(item => ({
          title: item.title.trim(),
          lessons: Number(item.lessons),
          time: item.time.trim(),
        })),
      };
      if (currentId) {
        await updateDoc(doc(db, 'courses', currentId), value);
      } else if (customId.trim()) {
        await setDoc(doc(db, 'courses', customId.trim()), value);
      } else {
        await addDoc(collection(db, 'courses'), value);
      }
      await fetchData();
      setIsEditing(false);
      resetForm();
      setMessage({ type: 'success', text: 'কোর্সটি সফলভাবে সেভ হয়েছে।' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'কোর্সটি সেভ করা যায়নি। তথ্যগুলো পরীক্ষা করে আবার চেষ্টা করুন।' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (course: Course) => {
    setForm({
      title: course.title,
      description: course.description,
      mainCategory: course.mainCategory || course.category,
      subCategory: course.subCategory || '',
      instructor: course.instructor,
      price: course.price,
      rating: course.rating || 0,
      lessons: course.lessons || 0,
      duration: course.duration || '',
      level: course.level || 'Beginner',
      image: course.image || '',
      outcomes: course.outcomes || [],
      curriculum: course.curriculum || [],
    });
    setCurrentId(course.id);
    setMessage(null);
    setIsEditing(true);
  };

  const handleDelete = async (course: Course) => {
    if (!window.confirm(`“${course.title}” কোর্সটি মুছে ফেলবেন? এই কাজটি ফিরিয়ে আনা যাবে না।`)) return;
    try {
      await deleteDoc(doc(db, 'courses', course.id));
      await fetchData();
      setMessage({ type: 'success', text: 'কোর্সটি মুছে ফেলা হয়েছে।' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'কোর্সটি মুছে ফেলা যায়নি।' });
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-[#2563EB]" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">{isEditing ? (currentId ? 'কোর্স পরিবর্তন করুন' : 'নতুন কোর্স তৈরি করুন') : 'সব কোর্স'}</h2>
          <p className="mt-1 text-sm text-slate-400">{courses.length}টি কোর্স আছে। প্রতিটি কোর্সের লেখা, মূল্য, ছবি ও curriculum এখান থেকে বদলানো যাবে।</p>
        </div>
        {!isEditing && (
          <button type="button" onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-bold text-white hover:bg-blue-500">
            <Plus className="h-4 w-4" /> নতুন কোর্স
          </button>
        )}
      </div>

      {message && (
        <div role="status" className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/20 bg-rose-400/10 text-rose-200'}`}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />} {message.text}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7">
          <div className="rounded-xl border border-blue-400/15 bg-blue-400/5 px-4 py-3 text-sm text-blue-100">
            লাল তারকা দেওয়া তথ্যগুলো অবশ্যই পূরণ করুন। আগে মূল তথ্য দিন, পরে চাইলে learning outcomes ও curriculum যোগ করুন।
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="কোর্সের নাম *"><input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="যেমন: SSC Mathematics Complete Course" className={inputClass} /></Field>
            </div>
            <Field label="Main Category *">
              <select required value={form.mainCategory} onChange={event => setForm({ ...form, mainCategory: event.target.value, subCategory: '' })} className={inputClass}>
                <option value="">Category বেছে নিন</option>
                {categoryOptions.map(item => <option key={item.id} value={item.title}>{item.title}</option>)}
              </select>
            </Field>
            <Field label="Subcategory" helper="প্রয়োজন না হলে খালি রাখুন।">
              <select value={form.subCategory} onChange={event => setForm({ ...form, subCategory: event.target.value })} className={inputClass}>
                <option value="">Subcategory বেছে নিন</option>
                {subcategoryOptions.map(item => <option key={item.id} value={item.title}>{item.title}</option>)}
              </select>
            </Field>
            <Field label="শিক্ষকের নাম *"><input required value={form.instructor} onChange={event => setForm({ ...form, instructor: event.target.value })} placeholder="শিক্ষকের পূর্ণ নাম" className={inputClass} /></Field>
            <Field label="Level"><select value={form.level} onChange={event => setForm({ ...form, level: event.target.value })} className={inputClass}><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>All Levels</option></select></Field>
            <Field label="মূল্য (৳) *" helper="Free course হলে 0 দিন।"><input required min={0} type="number" value={form.price} onChange={event => setForm({ ...form, price: Number(event.target.value) })} className={inputClass} /></Field>
            <Field label="মোট lesson"><input min={0} type="number" value={form.lessons} onChange={event => setForm({ ...form, lessons: Number(event.target.value) })} className={inputClass} /></Field>
            <Field label="সময়কাল" helper="যেমন: 12 Weeks"><input value={form.duration} onChange={event => setForm({ ...form, duration: event.target.value })} placeholder="12 Weeks" className={inputClass} /></Field>
            <Field label="Rating" helper="0 থেকে 5-এর মধ্যে।"><input min={0} max={5} step={0.1} type="number" value={form.rating} onChange={event => setForm({ ...form, rating: Number(event.target.value) })} className={inputClass} /></Field>
            <div className="md:col-span-2">
              <Field label="কোর্সের পরিচিতি *" helper="শিক্ষার্থী course card ও details page-এ এটি দেখবে।">
                <textarea required rows={5} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className={inputClass} />
              </Field>
            </div>
          </div>

          <UploadField label="কোর্সের cover image" value={form.image} onChange={value => setForm({ ...form, image: value })} folder="course-covers" />

          <Field label="এই কোর্সে কী শিখবে?" helper="প্রতিটি outcome নতুন লাইনে লিখুন।">
            <textarea rows={6} value={form.outcomes.join('\n')} onChange={event => setForm({ ...form, outcomes: event.target.value.split('\n') })} placeholder={'Algebra mastery\nBoard exam preparation\nProblem-solving confidence'} className={inputClass} />
          </Field>

          <div className="rounded-2xl border border-white/10 bg-black/15 p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-extrabold text-white">Curriculum / মডিউল</h3>
                <p className="mt-1 text-xs text-slate-400">প্রতিটি অধ্যায় বা module আলাদা করে যোগ করুন।</p>
              </div>
              <button type="button" onClick={() => setForm({ ...form, curriculum: [...form.curriculum, { title: '', lessons: 1, time: '' }] })}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10">
                <Plus className="h-3.5 w-3.5" /> Module যোগ করুন
              </button>
            </div>
            {form.curriculum.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-500">এখনো কোনো module যোগ করা হয়নি।</div>
            ) : (
              <div className="space-y-3">
                {form.curriculum.map((module, index) => (
                  <div key={index} className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 md:grid-cols-[1fr_120px_150px_42px] md:items-end">
                    <Field label={`Module ${index + 1} নাম`}><input value={module.title} onChange={event => setForm({ ...form, curriculum: form.curriculum.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) })} className={inputClass} /></Field>
                    <Field label="Lesson"><input min={0} type="number" value={module.lessons} onChange={event => setForm({ ...form, curriculum: form.curriculum.map((item, itemIndex) => itemIndex === index ? { ...item, lessons: Number(event.target.value) } : item) })} className={inputClass} /></Field>
                    <Field label="সময়"><input value={module.time} onChange={event => setForm({ ...form, curriculum: form.curriculum.map((item, itemIndex) => itemIndex === index ? { ...item, time: event.target.value } : item) })} placeholder="2h 30m" className={inputClass} /></Field>
                    <button type="button" onClick={() => setForm({ ...form, curriculum: form.curriculum.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Remove module ${index + 1}`} className="mb-0.5 flex h-11 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!currentId && (
            <div>
              <button type="button" onClick={() => setShowAdvanced(value => !value)} className="text-xs font-bold text-slate-400 hover:text-white">{showAdvanced ? 'Advanced option লুকান' : 'Advanced option দেখুন'}</button>
              {showAdvanced && (
                <div className="mt-3 max-w-xl">
                  <Field label="Custom ID" helper="সাধারণত খালি রাখুন; system নিজে ID তৈরি করবে।"><input value={customId} onChange={event => setCustomId(event.target.value)} className={inputClass} /></Field>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => { setIsEditing(false); resetForm(); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"><X className="h-4 w-4" /> বাতিল</button>
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saving ? 'সেভ হচ্ছে…' : 'কোর্স সেভ করুন'}
            </button>
          </div>
        </form>
      ) : courses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
          <BookOpenPlaceholder />
          <h3 className="mt-4 text-lg font-extrabold text-white">এখনো কোনো কোর্স নেই</h3>
          <p className="mt-1 text-sm text-slate-400">প্রথম কোর্সটি যোগ করে শুরু করুন।</p>
          <button type="button" onClick={openNew} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4" /> নতুন কোর্স</button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="min-w-[850px] w-full text-left text-sm text-white">
            <thead className="bg-black/20 text-xs uppercase tracking-wider text-slate-400">
              <tr><th className="p-4">কোর্স</th><th className="p-4">বিভাগ</th><th className="p-4">শিক্ষক</th><th className="p-4">মূল্য</th><th className="p-4 text-right">কাজ</th></tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                  <td className="p-4"><div className="font-bold">{course.title}</div><div className="mt-1 text-xs text-slate-500">{course.lessons || 0} lessons · {course.duration || 'সময় দেওয়া নেই'}</div></td>
                  <td className="p-4 text-slate-300">{course.mainCategory || course.category}<div className="text-xs text-slate-500">{course.subCategory || '—'}</div></td>
                  <td className="p-4 text-slate-300">{course.instructor}</td>
                  <td className="p-4 font-bold">{course.price === 0 ? <span className="text-emerald-300">Free</span> : formatCurrency(course.price)}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => handleEdit(course)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/15 bg-blue-400/10 px-3 py-2 text-xs font-bold text-blue-200 hover:bg-blue-400/20"><Edit2 className="h-3.5 w-3.5" /> এডিট</button>
                      <button type="button" onClick={() => handleDelete(course)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/15 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-200 hover:bg-rose-400/20"><Trash2 className="h-3.5 w-3.5" /> মুছুন</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BookOpenPlaceholder() {
  return (
    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-400/10 text-blue-300">
      <Plus className="h-6 w-6" />
    </span>
  );
}
