import React, { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { Edit2, Plus, Save, Trash2, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import type { Exam } from '../../lib/types';
import { exams as defaultExams } from '../../lib/data';
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
  const [exams, setExams] = useState<Exam[]>(defaultExams);
  const [editing, setEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [customId, setCustomId] = useState('');
  const [form, setForm] = useState<ExamForm>(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'exams'), (snapshot) => {
      if (!snapshot.empty) {
        setExams(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Exam[]);
      }
    });
    return unsubscribe;
  }, []);

  const reset = () => {
    setEditing(false);
    setCurrentId(null);
    setCustomId('');
    setForm(emptyForm);
    setError('');
  };

  const validate = () => {
    const open = dhakaInputToDate(form.registrationOpenDate, form.registrationOpenTime);
    const close = dhakaInputToDate(form.registrationCloseDate, form.registrationCloseTime);
    const start = dhakaInputToDate(form.examStartDate, form.examStartTime);
    if (!open || !close || !start) return 'Invalid schedule date/time / সময়সূচির তারিখ বা সময় ঠিক নেই।';
    if (open >= close) return 'Registration open must be before close / রেজিস্ট্রেশন শুরুর সময় বন্ধের আগের হতে হবে।';
    if (close > start) return 'Registration close must be before or equal exam start / রেজিস্ট্রেশন বন্ধ পরীক্ষা শুরুর আগে বা একই সময়ে হতে হবে।';
    if (form.durationMinutes <= 0) return 'Duration must be greater than 0 / সময়কাল ০-এর বেশি হতে হবে।';
    return '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const open = dhakaInputToDate(form.registrationOpenDate, form.registrationOpenTime)!;
    const close = dhakaInputToDate(form.registrationCloseDate, form.registrationCloseTime)!;
    const start = dhakaInputToDate(form.examStartDate, form.examStartTime)!;
    const data = {
      title: form.title,
      category: form.mainCategory || form.category,
      mainCategory: form.mainCategory || form.category,
      subCategory: form.subCategory,
      type: form.type,
      fee: Number(form.fee),
      syllabus: form.syllabus,
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
    } else if (customId) {
      await setDoc(doc(db, 'exams', customId), { ...data, createdAt: Date.now() });
    } else {
      await addDoc(collection(db, 'exams'), { ...data, createdAt: Date.now() });
    }
    reset();
  };

  const seedDefaultSchedule = async () => {
    if (!confirm('Seed/update the default December 2026 exam schedule?')) return;
    for (const exam of defaultExams) {
      await setDoc(doc(db, 'exams', exam.id), { ...exam, updatedAt: Date.now() }, { merge: true });
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Exam Schedule</h2>
          <p className="mt-1 text-xs text-slate-400">All times use Bangladesh Time - Asia/Dhaka (UTC+6). সব সময় বাংলাদেশ সময় অনুযায়ী।</p>
        </div>
        <button onClick={() => { setEditing(true); setCurrentId(null); setForm(emptyForm); }} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Exam
        </button>
        <button onClick={seedDefaultSchedule} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">
          Seed Default Schedule
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSubmit} className="mb-8 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
          {!currentId && <input placeholder="Custom ID (optional)" value={customId} onChange={e => setCustomId(e.target.value)} className="w-full rounded border p-2 text-slate-800" />}
          <input required placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded border p-2 text-slate-800" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input required placeholder="Main Category" value={form.mainCategory} onChange={e => setForm({ ...form, mainCategory: e.target.value })} className="rounded border p-2 text-slate-800" />
            <input placeholder="Subcategory" value={form.subCategory} onChange={e => setForm({ ...form, subCategory: e.target.value })} className="rounded border p-2 text-slate-800" />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ExamForm['type'] })} className="rounded border p-2 text-slate-800">
              <option value="MCQ">MCQ</option>
              <option value="Written">Written</option>
            </select>
          </div>
          <textarea required placeholder="Syllabus" value={form.syllabus} onChange={e => setForm({ ...form, syllabus: e.target.value })} className="w-full rounded border p-2 text-slate-800" />
          <UploadField
            label="Cover Image / পরীক্ষার কভার"
            value={form.coverImage}
            onChange={coverImage => setForm({ ...form, coverImage })}
            folder="exam-covers"
          />
          <p className="-mt-3 text-xs text-slate-300">Image URL অথবা /course-covers/file-name.png path দিন।</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input type="number" min={0} placeholder="Fee" value={form.fee} onChange={e => setForm({ ...form, fee: Number(e.target.value) })} className="rounded border p-2 text-slate-800" />
            <input type="number" min={0} placeholder="Total Marks" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: Number(e.target.value) })} className="rounded border p-2 text-slate-800" />
            <input type="number" min={1} placeholder="Duration Minutes / পরীক্ষার সময়কাল" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })} className="rounded border p-2 text-slate-800" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="text-xs font-bold text-slate-300">Registration Open Date / রেজিস্ট্রেশন শুরুর তারিখ<input type="date" required value={form.registrationOpenDate} onChange={e => setForm({ ...form, registrationOpenDate: e.target.value })} className="mt-1 w-full rounded border p-2 text-slate-800" /></label>
            <label className="text-xs font-bold text-slate-300">Registration Open Time / রেজিস্ট্রেশন শুরুর সময়<input type="time" required value={form.registrationOpenTime} onChange={e => setForm({ ...form, registrationOpenTime: e.target.value })} className="mt-1 w-full rounded border p-2 text-slate-800" /></label>
            <div />
            <label className="text-xs font-bold text-slate-300">Registration Close Date / রেজিস্ট্রেশন বন্ধের তারিখ<input type="date" required value={form.registrationCloseDate} onChange={e => setForm({ ...form, registrationCloseDate: e.target.value })} className="mt-1 w-full rounded border p-2 text-slate-800" /></label>
            <label className="text-xs font-bold text-slate-300">Registration Close Time / রেজিস্ট্রেশন বন্ধের সময়<input type="time" required value={form.registrationCloseTime} onChange={e => setForm({ ...form, registrationCloseTime: e.target.value })} className="mt-1 w-full rounded border p-2 text-slate-800" /></label>
            <div />
            <label className="text-xs font-bold text-slate-300">Exam Start Date / পরীক্ষা শুরুর তারিখ<input type="date" required value={form.examStartDate} onChange={e => setForm({ ...form, examStartDate: e.target.value })} className="mt-1 w-full rounded border p-2 text-slate-800" /></label>
            <label className="text-xs font-bold text-slate-300">Exam Start Time / পরীক্ষা শুরুর সময়<input type="time" required value={form.examStartTime} onChange={e => setForm({ ...form, examStartTime: e.target.value })} className="mt-1 w-full rounded border p-2 text-slate-800" /></label>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="text-xs font-bold text-slate-300">Publish Status / প্রকাশনার অবস্থা<select value={form.publishStatus} onChange={e => setForm({ ...form, publishStatus: e.target.value as ExamForm['publishStatus'] })} className="mt-1 w-full rounded border p-2 text-slate-800"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
            <label className="text-xs font-bold text-slate-300">Status Override / স্ট্যাটাস পরিবর্তন<select value={form.statusOverride} onChange={e => setForm({ ...form, statusOverride: e.target.value as ExamForm['statusOverride'] })} className="mt-1 w-full rounded border p-2 text-slate-800"><option value="auto">Auto</option><option value="upcoming">Upcoming</option><option value="live">Live</option><option value="ended">Ended</option></select></label>
            <label className="mt-6 flex items-center gap-2 text-sm font-bold text-slate-200"><input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} /> Featured on Homepage / হোমপেজে দেখান</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"><Save className="h-4 w-4" /> Save</button>
            <button type="button" onClick={reset} className="flex items-center gap-2 rounded-xl bg-slate-600 px-4 py-2 text-sm font-bold text-white"><X className="h-4 w-4" /> Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {exams.map(exam => (
          <div key={exam.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center">
            <img src={getExamCover(exam.title, exam.coverImage)} alt={`${exam.title} cover`} className="h-28 w-full rounded-xl object-cover object-top md:w-44" />
            <div className="flex-grow">
              <h3 className="font-bold text-white">{exam.title}</h3>
              <p className="text-xs text-slate-400">{exam.mainCategory || exam.category} • {exam.type} • {formatDhakaDateTime(exam.scheduledStartAt)}</p>
              <p className="text-xs text-slate-500">Registration: {formatDhakaDateTime(exam.registrationOpenAt)} - {formatDhakaDateTime(exam.registrationCloseAt)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setCurrentId(exam.id); setForm(formFromExam(exam)); setEditing(true); }} className="rounded p-2 text-blue-400 hover:bg-blue-400/10"><Edit2 className="h-4 w-4" /></button>
              <button onClick={() => exam.id && confirm('Delete this exam?') && deleteDoc(doc(db, 'exams', exam.id))} className="rounded p-2 text-red-400 hover:bg-red-400/10"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
