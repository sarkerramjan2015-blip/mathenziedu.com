import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AlertCircle, CheckCircle, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import type { ExamQuestion, Exam } from '../../lib/types';

interface AdminExamQuestionsProps {
  exams: Exam[];
}

export default function AdminExamQuestions({ exams }: AdminExamQuestionsProps) {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState<Partial<ExamQuestion>>({
    questionType: 'mcq',
    questionText: '',
    options: ['', '', '', ''],
    correctOption: 0,
    marks: 1,
    explanation: '',
    order: 0,
  });

  const fetchQuestions = async (examId: string) => {
    if (!examId) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'examQuestions'), orderBy('order', 'asc'));
      const snap = await getDocs(q);
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as ExamQuestion[];
      setQuestions(all.filter(q => q.examId === examId));
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'প্রশ্নগুলো লোড করা যায়নি। আবার চেষ্টা করুন।' });
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (selectedExamId) fetchQuestions(selectedExamId);
    else { setQuestions([]); setLoading(false); }
  }, [selectedExamId]);

  const resetForm = () => {
    setForm({ questionType: 'mcq', questionText: '', options: ['', '', '', ''], correctOption: 0, marks: 1, explanation: '', order: questions.length });
    setAddingNew(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.questionText?.trim()) {
      setMessage({ type: 'error', text: 'প্রশ্নটি লিখুন।' });
      return;
    }
    if (!form.marks || form.marks <= 0) {
      setMessage({ type: 'error', text: 'নম্বর ০-এর বেশি হতে হবে।' });
      return;
    }
    if (form.questionType === 'mcq' && (form.options || []).some(option => !option.trim())) {
      setMessage({ type: 'error', text: 'MCQ প্রশ্নের চারটি উত্তরই পূরণ করুন।' });
      return;
    }
    setSaving(true);
    setMessage(null);
    const now = Date.now();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'examQuestions', editingId), {
          questionType: form.questionType,
          questionText: form.questionText,
          options: form.questionType === 'mcq' ? form.options : [],
          correctOption: form.questionType === 'mcq' ? form.correctOption : -1,
          marks: form.marks,
          explanation: form.explanation || '',
          updatedAt: now,
        });
      } else {
        const value = {
          examId: selectedExamId,
          questionType: form.questionType,
          questionText: form.questionText,
          marks: form.marks,
          order: questions.length,
          createdAt: now,
          updatedAt: now,
          ...(form.questionType === 'mcq' ? {
            options: form.options,
            correctOption: form.correctOption,
          } : {}),
        };
        const createdQuestion = await addDoc(collection(db, 'examQuestions'), value);
        if (form.explanation?.trim()) {
          await updateDoc(createdQuestion, { explanation: form.explanation.trim() });
        }
      }
      resetForm();
      await fetchQuestions(selectedExamId);
      setMessage({ type: 'success', text: 'প্রশ্নটি সফলভাবে সেভ হয়েছে।' });
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'প্রশ্নটি সেভ করা যায়নি। তথ্যগুলো দেখে আবার চেষ্টা করুন।' });
    }
    finally { setSaving(false); }
  };

  const handleDelete = async (qId: string) => {
    if (!confirm('প্রশ্নটি মুছে ফেলবেন?')) return;
    setMessage(null);
    try {
      await deleteDoc(doc(db, 'examQuestions', qId));
      await fetchQuestions(selectedExamId);
      setMessage({ type: 'success', text: 'প্রশ্নটি মুছে ফেলা হয়েছে।' });
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'প্রশ্নটি মুছতে সমস্যা হয়েছে।' });
    }
  };

  const startEdit = (q: ExamQuestion) => {
    setForm({
      questionType: q.questionType,
      questionText: q.questionText,
      options: q.options || ['', '', '', ''],
      correctOption: q.correctOption ?? 0,
      marks: q.marks,
      explanation: q.explanation || '',
      order: q.order,
    });
    setEditingId(q.id || null);
    setAddingNew(false);
  };

  const selectedExam = exams.find(e => e.id === selectedExamId);
  const mcqCount = questions.filter(q => q.questionType === 'mcq').length;
  const writtenCount = questions.filter(q => q.questionType === 'written').length;
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div>
      {/* Exam Selector */}
      <div className="mb-6">
        <label className="text-sm font-bold text-white mb-2 block">কোন পরীক্ষার প্রশ্ন এডিট করবেন?</label>
        <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}
          className="w-full max-w-md rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]">
          <option value="">একটি পরীক্ষা বেছে নিন</option>
          {exams.map(exam => (
            <option key={exam.id} value={exam.id}>{exam.title} ({exam.type})</option>
          ))}
        </select>
      </div>

      {message && (
        <div className={`mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm ${message.type === 'success' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-rose-400/20 bg-rose-500/10 text-rose-200'}`}>
          {message.type === 'success' ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {selectedExamId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
              <div className="text-2xl font-bold text-white">{questions.length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">মোট প্রশ্ন</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
              <div className="text-2xl font-bold text-blue-300">{mcqCount}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">MCQ</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
              <div className="text-2xl font-bold text-purple-300">{writtenCount}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">লিখিত</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
              <div className="text-2xl font-bold text-[#10B981]">{totalMarks}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">মোট নম্বর</div>
            </div>
          </div>

          {/* Add New Button */}
          {!addingNew && !editingId && (
            <button type="button" onClick={() => { resetForm(); setAddingNew(true); setMessage(null); }}
              className="flex items-center gap-2 bg-[#2563EB] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-blue-500 transition-all mb-6 shadow-lg">
              <Plus className="h-4 w-4" /> নতুন প্রশ্ন
            </button>
          )}

          {/* Add/Edit Form */}
          {(addingNew || editingId) && (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">{editingId ? 'প্রশ্ন এডিট করুন' : 'নতুন প্রশ্ন যোগ করুন'}</h3>
                <button type="button" onClick={resetForm} className="text-slate-400 hover:text-white p-1"><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-4">
                {/* Question Type */}
                <div>
                  <label className="text-sm font-bold text-white block mb-2">প্রশ্নের ধরন</label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setForm({ ...form, questionType: 'mcq' })}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${form.questionType === 'mcq' ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>MCQ</button>
                    <button type="button" onClick={() => setForm({ ...form, questionType: 'written' })}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${form.questionType === 'written' ? 'bg-purple-500 text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>লিখিত</button>
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <label className="text-sm font-bold text-white block mb-1">প্রশ্ন *</label>
                  <textarea value={form.questionText} onChange={e => setForm({ ...form, questionText: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-slate-600" />
                </div>

                {/* MCQ Options */}
                {form.questionType === 'mcq' && (
                  <div>
                    <label className="text-sm font-bold text-white block mb-2">উত্তরের অপশন—সঠিক উত্তরটি চিহ্নিত করুন</label>
                    {form.options?.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-400 w-6">{['A', 'B', 'C', 'D'][i]}</span>
                        <input value={opt} onChange={e => {
                          const opts = [...(form.options || [])];
                          opts[i] = e.target.value;
                          setForm({ ...form, options: opts });
                        }}
                          className="flex-grow rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#2563EB] placeholder:text-slate-600" />
                        <button type="button" onClick={() => setForm({ ...form, correctOption: i })}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${form.correctOption === i ? 'bg-[#10B981] text-white' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                          {form.correctOption === i ? 'সঠিক ✓' : 'সঠিক উত্তর'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Marks */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-white block mb-1">এই প্রশ্নের নম্বর</label>
                    <input type="number" min={0.5} step={0.5} value={form.marks} onChange={e => setForm({ ...form, marks: parseFloat(e.target.value) || 1 })}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-[#2563EB]" />
                  </div>
                </div>

                {/* Explanation (MCQ) */}
                {form.questionType === 'mcq' && (
                  <div>
                    <label className="text-sm font-bold text-white block mb-1">উত্তরের ব্যাখ্যা (পরীক্ষার পরে দেখাবে)</label>
                    <textarea value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })}
                      rows={2}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-[#2563EB] placeholder:text-slate-600" />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 bg-[#10B981] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-500 transition-all disabled:opacity-50 shadow-lg">
                    <Save className="h-4 w-4" /> {saving ? 'সেভ হচ্ছে…' : 'প্রশ্ন সেভ করুন'}
                  </button>
                  <button type="button" onClick={resetForm} className="text-slate-400 text-sm font-bold px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5">বাতিল</button>
                </div>
              </div>
            </div>
          )}

          {/* Questions List */}
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" /></div>
          ) : questions.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <p className="text-slate-500">এখনও কোনো প্রশ্ন নেই। “নতুন প্রশ্ন” চাপুন।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-500">Q{idx + 1}.</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          q.questionType === 'mcq' ? 'bg-[#2563EB]/10 text-blue-300' : 'bg-purple-500/10 text-purple-300'
                        }`}>{q.questionType === 'mcq' ? 'MCQ' : 'লিখিত'}</span>
                        <span className="text-[10px] text-slate-500">{q.marks} নম্বর</span>
                      </div>
                      <p className="text-sm text-white font-medium">{q.questionText}</p>
                      {q.questionType === 'mcq' && q.options && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {q.options.map((opt, i) => (
                            <span key={i} className={`text-xs px-2 py-1 rounded border ${
                              i === q.correctOption ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]' : 'border-white/10 text-slate-400'
                            }`}>
                              {['A', 'B', 'C', 'D'][i]}. {opt}
                            </span>
                          ))}
                        </div>
                      )}
                      {q.explanation && (
                        <p className="mt-1 text-[11px] text-slate-500 italic">ব্যাখ্যা: {q.explanation}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" aria-label="প্রশ্ন এডিট করুন" onClick={() => startEdit(q)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"><Edit2 className="h-4 w-4" /></button>
                      <button type="button" aria-label="প্রশ্ন মুছুন" onClick={() => q.id && handleDelete(q.id)} className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!selectedExamId && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-slate-500">প্রশ্ন দেখার বা যোগ করার জন্য উপরের তালিকা থেকে একটি পরীক্ষা বেছে নিন।</p>
        </div>
      )}
    </div>
  );
}
