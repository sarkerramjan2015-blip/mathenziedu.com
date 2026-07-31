import React, { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { CheckCircle, Edit2, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import type { Exam, MainCategory, SubCategory } from '../../lib/types';
import { exams as defaultExams, MAIN_CATEGORIES_DATA } from '../../lib/data';
import { formatDhakaDateTime, formatDurationLabel, toDate } from '../../lib/examStatus';
import { getExamCover } from '../../lib/examCovers';
import { UploadField } from '../../lib/upload';

interface ExamForm {
  title: string;
  category: string;
  mainCategory: string;
  subCategory: string;
  type: 'MCQ' | 'Written';
  fee: number;
  syllabus: string;
  totalMarks: number;
  coverImage: string;
  registrationOpenDate: string;
  registrationOpenTime: string;
  registrationCloseDate: string;
  registrationCloseTime: string;
  examStartDate: string;
  examStartTime: string;
  durationMinutes: number;
  publishStatus: 'draft' | 'published' | 'archived';
  isFeatured: boolean;
  statusOverride: 'auto' | 'upcoming' | 'live' | 'ended';
}

const emptyForm: ExamForm = {
  title: '',
  category: '',
  mainCategory: '',
  subCategory: '',
  type: 'MCQ',
  fee: 0,
  syllabus: '',
  totalMarks: 0,
  coverImage: '',
  registrationOpenDate: '',
  registrationOpenTime: '',
  registrationCloseDate: '',
  registrationCloseTime: '',
  examStartDate: '',
  examStartTime: '',
  durationMinutes: 60,
  publishStatus: 'published',
  isFeatured: true,
  statusOverride: 'auto',
};

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#0B1220] px-4 py-3 text-sm text-white outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-slate-600';

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-white">{label}</span>
      {children}
      {helper && <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">{helper}</span>}
    </label>
  );
}

function dhakaInputToDate(date: string, time: string) {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}:00+06:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateParts(value: unknown) {
  const date = toDate(value as never);
  if (!date) return { date: '', time: '' };
  const dhaka = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => dhaka.find(part => part.type === type)?.value || '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}

function formFromExam(exam: Exam): ExamForm {
  const open = dateParts(exam.registrationOpenAt);
  const close = dateParts(exam.registrationCloseAt);
  const start = dateParts(exam.scheduledStartAt);
  return {
    title: exam.title,
    category: exam.category,
    mainCategory: exam.mainCategory || exam.category,
    subCategory: exam.subCategory || '',
    type: exam.type,
    fee: exam.fee,
    syllabus: exam.syllabus,
    totalMarks: exam.totalMarks,
    coverImage: exam.coverImage || '',
    registrationOpenDate: open.date,
    registrationOpenTime: open.time,
    registrationCloseDate: close.date,
    registrationCloseTime: close.time,
    examStartDate: start.date,
    examStartTime: start.time,
    durationMinutes: exam.durationMinutes || 60,
    publishStatus: exam.publishStatus || 'published',
    isFeatured: exam.isFeatured ?? true,
    statusOverride: exam.statusOverride || 'auto',
  };
}

export default function AdminExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [customId, setCustomId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<ExamForm>(emptyForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribeExams = onSnapshot(collection(db, 'exams'), (snapshot) => {
      setExams(snapshot.docs.map(item => ({ id: item.id, ...item.data() })) as Exam[]);
      setLoading(false);
    }, (snapshotError) => {
      console.error(snapshotError);
      setError('পরীক্ষার তালিকা লোড করা যায়নি। আবার চেষ্টা করুন।');
      setLoading(false);
    });
    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), snapshot => {
      setMainCategories(snapshot.docs.map(item => ({ id: item.id, ...item.data() })) as MainCategory[]);
    });
    const unsubscribeSubcategories = onSnapshot(collection(db, 'subcategories'), snapshot => {
      setSubCategories(snapshot.docs.map(item => ({ id: item.id, ...item.data() })) as SubCategory[]);
    });
    return () => {
      unsubscribeExams();
      unsubscribeCategories();
      unsubscribeSubcategories();
    };
  }, []);

  const reset = () => {
    setEditing(false);
    setCurrentId(null);
    setCustomId('');
    setShowAdvanced(false);
    setForm(emptyForm);
    setError('');
  };

  const validate = () => {
    const open = dhakaInputToDate(form.registrationOpenDate, form.registrationOpenTime);
    const close = dhakaInputToDate(form.registrationCloseDate, form.registrationCloseTime);
    const start = dhakaInputToDate(form.examStartDate, form.examStartTime);
    if (!form.mainCategory) return 'একটি মূল বিভাগ বেছে নিন।';
    if (!open || !close || !start) return 'সময়সূচির সব তারিখ ও সময় ঠিকভাবে দিন।';
    if (open >= close) return 'রেজিস্ট্রেশন শুরুর সময় অবশ্যই বন্ধের সময়ের আগে হতে হবে।';
    if (close > start) return 'পরীক্ষা শুরুর আগেই রেজিস্ট্রেশন বন্ধ হতে হবে।';
    if (form.durationMinutes <= 0) return 'পরীক্ষার সময়কাল ০ মিনিটের বেশি হতে হবে।';
    return '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const open = dhakaInputToDate(form.registrationOpenDate, form.registrationOpenTime)!;
      const close = dhakaInputToDate(form.registrationCloseDate, form.registrationCloseTime)!;
      const start = dhakaInputToDate(form.examStartDate, form.examStartTime)!;
      const data = {
        title: form.title.trim(),
        category: form.mainCategory,
        mainCategory: form.mainCategory,
        subCategory: form.subCategory,
        type: form.type,
        fee: Number(form.fee),
        syllabus: form.syllabus.trim(),
        totalMarks: Number(form.totalMarks),
        coverImage: form.coverImage,
        registrationOpenAt: Timestamp.fromDate(open),
        registrationCloseAt: Timestamp.fromDate(close),
        scheduledStartAt: Timestamp.fromDate(start),
        durationMinutes: Number(form.durationMinutes),
        duration: formatDurationLabel(Number(form.durationMinutes)),
        date: form.examStartDate,
        timezone: 'Asia/Dhaka' as const,
        publishStatus: form.publishStatus,
        isFeatured: form.isFeatured,
        statusOverride: form.statusOverride,
        isPublished: form.publishStatus === 'published',
        updatedAt: Date.now(),
      };

      if (currentId) {
        await updateDoc(doc(db, 'exams', currentId), data);
      } else if (customId.trim()) {
        await setDoc(doc(db, 'exams', customId.trim()), { ...data, createdAt: Date.now() });
      } else {
        await addDoc(collection(db, 'exams'), { ...data, createdAt: Date.now() });
      }
      reset();
      setMessage('পরীক্ষাটি সফলভাবে সেভ হয়েছে।');
    } catch (saveError) {
      console.error(saveError);
      setError('পরীক্ষাটি সেভ করা যায়নি। তথ্যগুলো দেখে আবার চেষ্টা করুন।');
    } finally {
      setSaving(false);
    }
  };

  const seedDefaultSchedule = async () => {
    if (!confirm('ডিসেম্বর ২০২৬-এর উদাহরণ পরীক্ষাগুলো তৈরি করবেন? আগে থেকে একই ID থাকলে তার তথ্য আপডেট হবে।')) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      for (const exam of defaultExams) {
        await setDoc(doc(db, 'exams', exam.id), { ...exam, updatedAt: Date.now() }, { merge: true });
      }
      setMessage('উদাহরণ পরীক্ষার সময়সূচি তৈরি হয়েছে। এখন চাইলে প্রতিটি পরীক্ষা এডিট করুন।');
    } catch (seedError) {
      console.error(seedError);
      setError('উদাহরণ পরীক্ষাগুলো তৈরি করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setSaving(false);
    }
  };

  const removeExam = async (exam: Exam) => {
    if (!exam.id || !confirm(`“${exam.title}” পরীক্ষাটি মুছে ফেলবেন?`)) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await deleteDoc(doc(db, 'exams', exam.id));
      setMessage('পরীক্ষাটি মুছে ফেলা হয়েছে।');
    } catch (deleteError) {
      console.error(deleteError);
      setError('পরীক্ষাটি মুছতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = mainCategories.length
    ? mainCategories
    : MAIN_CATEGORIES_DATA.map((item, index) => ({ id: `default-${index}`, title: item.title, description: item.description }));
  const storedSubcategories = subCategories.filter(item => item.parentMainCategory === form.mainCategory);
  const fallbackSubcategories = MAIN_CATEGORIES_DATA
    .find(item => item.title === form.mainCategory)?.subCategories
    .map((title, index) => ({ id: `default-sub-${index}`, title, parentMainCategory: form.mainCategory })) || [];
  const subcategoryOptions = storedSubcategories.length ? storedSubcategories : fallbackSubcategories;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">পরীক্ষা ও সময়সূচি</h2>
          <p className="mt-1 text-sm text-slate-400">সব সময় বাংলাদেশ সময় অনুযায়ী। আগে রেজিস্ট্রেশনের সময়, তারপর পরীক্ষা শুরুর সময় দিন।</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { reset(); setEditing(true); }} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500">
            <Plus className="h-4 w-4" /> নতুন পরীক্ষা
          </button>
          {exams.length === 0 && (
            <button disabled={saving} type="button" onClick={seedDefaultSchedule} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/10 disabled:opacity-60">
              উদাহরণ তালিকা তৈরি
            </button>
          )}
        </div>
      </div>

      {message && <div className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />{message}</div>}
      {!editing && error && <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

      {editing && (
        <form onSubmit={handleSubmit} className="mb-8 space-y-6 rounded-2xl border border-blue-400/20 bg-white/5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white">{currentId ? 'পরীক্ষার তথ্য এডিট করুন' : 'নতুন পরীক্ষা তৈরি করুন'}</h3>
              <p className="mt-1 text-xs text-slate-400">তারকা (*) দেওয়া তথ্য অবশ্যই পূরণ করুন।</p>
            </div>
            <button type="button" onClick={reset} aria-label="বন্ধ করুন" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
          <Field label="পরীক্ষার নাম *" helper="যে নামে শিক্ষার্থীরা পরীক্ষাটি দেখবে।">
            <input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} className={inputClass} placeholder="যেমন: SSC Mathematics Model Test" />
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="মূল বিভাগ *">
              <select required value={form.mainCategory} onChange={event => setForm({ ...form, mainCategory: event.target.value, category: event.target.value, subCategory: '' })} className={inputClass}>
                <option value="">বেছে নিন</option>
                {categoryOptions.map(item => <option key={item.id} value={item.title}>{item.title}</option>)}
              </select>
            </Field>
            <Field label="উপবিভাগ">
              <select value={form.subCategory} onChange={event => setForm({ ...form, subCategory: event.target.value })} className={inputClass} disabled={!form.mainCategory}>
                <option value="">প্রয়োজন না হলে খালি রাখুন</option>
                {subcategoryOptions.map(item => <option key={item.id} value={item.title}>{item.title}</option>)}
              </select>
            </Field>
            <Field label="প্রশ্নের ধরন *">
              <select value={form.type} onChange={event => setForm({ ...form, type: event.target.value as ExamForm['type'] })} className={inputClass}>
                <option value="MCQ">MCQ</option>
                <option value="Written">লিখিত</option>
              </select>
            </Field>
          </div>
          <Field label="সিলেবাস *" helper="কোন কোন অধ্যায় বা বিষয় থেকে প্রশ্ন হবে তা লিখুন।">
            <textarea required rows={4} value={form.syllabus} onChange={event => setForm({ ...form, syllabus: event.target.value })} className={inputClass} placeholder="সিলেবাস লিখুন" />
          </Field>
          <UploadField
            label="পরীক্ষার কভার ছবি"
            value={form.coverImage}
            onChange={coverImage => setForm({ ...form, coverImage })}
            folder="exam-covers"
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="ফি (৳)" helper="ফ্রি হলে ০ দিন।"><input type="number" min={0} value={form.fee} onChange={event => setForm({ ...form, fee: Number(event.target.value) })} className={inputClass} /></Field>
            <Field label="মোট নম্বর *"><input required type="number" min={1} value={form.totalMarks} onChange={event => setForm({ ...form, totalMarks: Number(event.target.value) })} className={inputClass} /></Field>
            <Field label="পরীক্ষার সময় (মিনিট) *"><input required type="number" min={1} value={form.durationMinutes} onChange={event => setForm({ ...form, durationMinutes: Number(event.target.value) })} className={inputClass} /></Field>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <h4 className="mb-4 font-black text-white">সময়সূচি</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="রেজিস্ট্রেশন শুরু—তারিখ *"><input type="date" required value={form.registrationOpenDate} onChange={event => setForm({ ...form, registrationOpenDate: event.target.value })} className={inputClass} /></Field>
              <Field label="রেজিস্ট্রেশন শুরু—সময় *"><input type="time" required value={form.registrationOpenTime} onChange={event => setForm({ ...form, registrationOpenTime: event.target.value })} className={inputClass} /></Field>
              <Field label="রেজিস্ট্রেশন বন্ধ—তারিখ *"><input type="date" required value={form.registrationCloseDate} onChange={event => setForm({ ...form, registrationCloseDate: event.target.value })} className={inputClass} /></Field>
              <Field label="রেজিস্ট্রেশন বন্ধ—সময় *"><input type="time" required value={form.registrationCloseTime} onChange={event => setForm({ ...form, registrationCloseTime: event.target.value })} className={inputClass} /></Field>
              <Field label="পরীক্ষা শুরু—তারিখ *"><input type="date" required value={form.examStartDate} onChange={event => setForm({ ...form, examStartDate: event.target.value })} className={inputClass} /></Field>
              <Field label="পরীক্ষা শুরু—সময় *"><input type="time" required value={form.examStartTime} onChange={event => setForm({ ...form, examStartTime: event.target.value })} className={inputClass} /></Field>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="প্রকাশের অবস্থা"><select value={form.publishStatus} onChange={event => setForm({ ...form, publishStatus: event.target.value as ExamForm['publishStatus'] })} className={inputClass}><option value="draft">খসড়া—শুধু Admin দেখবে</option><option value="published">প্রকাশিত—সবাই দেখবে</option><option value="archived">আর্কাইভ—লুকানো থাকবে</option></select></Field>
            <Field label="সময় অনুযায়ী অবস্থা" helper="Auto রাখলে সময় দেখে নিজে বদলাবে।"><select value={form.statusOverride} onChange={event => setForm({ ...form, statusOverride: event.target.value as ExamForm['statusOverride'] })} className={inputClass}><option value="auto">Auto—নিজে ঠিক হবে</option><option value="upcoming">Upcoming দেখান</option><option value="live">Live দেখান</option><option value="ended">Ended দেখান</option></select></Field>
            <label className="mt-7 flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B1220] px-4 py-3 text-sm font-bold text-slate-200"><input type="checkbox" checked={form.isFeatured} onChange={event => setForm({ ...form, isFeatured: event.target.checked })} className="h-4 w-4" /> হোমপেজে দেখান</label>
          </div>
          {!currentId && (
            <div>
              <button type="button" onClick={() => setShowAdvanced(value => !value)} className="text-xs font-bold text-slate-400 hover:text-white">{showAdvanced ? 'উন্নত অপশন লুকান' : 'উন্নত অপশন'}</button>
              {showAdvanced && <div className="mt-3"><Field label="Custom ID" helper="সাধারণত খালি রাখুন।"><input value={customId} onChange={event => setCustomId(event.target.value)} className={inputClass} placeholder="শুধু ইংরেজি অক্ষর, সংখ্যা, - বা _" /></Field></div>}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button disabled={saving} type="submit" className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} সেভ করুন</button>
            <button type="button" onClick={reset} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5">বাতিল</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-300"><Loader2 className="h-4 w-4 animate-spin" /> পরীক্ষার তালিকা লোড হচ্ছে…</div>
      ) : exams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center">
          <p className="font-bold text-white">এখনও কোনো পরীক্ষা তৈরি হয়নি</p>
          <p className="mt-2 text-sm text-slate-400">নিজে নতুন পরীক্ষা তৈরি করুন, অথবা উদাহরণ তালিকা দিয়ে শুরু করুন।</p>
        </div>
      ) : <div className="space-y-4">
        {exams.map(exam => (
          <div key={exam.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center">
            <img src={getExamCover(exam.title, exam.coverImage)} alt={`${exam.title} cover`} className="h-28 w-full rounded-xl object-cover object-top md:w-44" />
            <div className="flex-grow">
              <h3 className="font-bold text-white">{exam.title}</h3>
              <p className="mt-1 text-xs text-slate-400">{exam.mainCategory || exam.category} • {exam.type === 'Written' ? 'লিখিত' : exam.type} • {formatDhakaDateTime(exam.scheduledStartAt)}</p>
              <p className="mt-1 text-xs text-slate-500">রেজিস্ট্রেশন: {formatDhakaDateTime(exam.registrationOpenAt)} – {formatDhakaDateTime(exam.registrationCloseAt)}</p>
              <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${exam.publishStatus === 'published' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'}`}>{exam.publishStatus === 'published' ? 'প্রকাশিত' : exam.publishStatus === 'archived' ? 'আর্কাইভ' : 'খসড়া'}</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setCurrentId(exam.id); setForm(formFromExam(exam)); setEditing(true); setError(''); setMessage(''); }} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/15 bg-blue-400/10 px-3 py-2 text-xs font-bold text-blue-200"><Edit2 className="h-3.5 w-3.5" /> এডিট</button>
              <button type="button" onClick={() => removeExam(exam)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/15 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-200"><Trash2 className="h-3.5 w-3.5" /> মুছুন</button>
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}
