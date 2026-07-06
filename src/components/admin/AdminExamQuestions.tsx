import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
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
    } catch (e) { console.error(e); }
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
    if (!form.questionText?.trim()) return;
    setSaving(true);
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
        await addDoc(collection(db, 'examQuestions'), {
          examId: selectedExamId,
          questionType: form.questionType,
          questionText: form.questionText,
          options: form.questionType === 'mcq' ? form.options : [],
          correctOption: form.questionType === 'mcq' ? form.correctOption : -1,
          marks: form.marks,
          explanation: form.explanation || '',
          order: questions.length,
          createdAt: now,
          updatedAt: now,
        });
      }
      resetForm();
      fetchQuestions(selectedExamId);
    } catch (e) { console.error(e); alert('Error saving question.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (qId: string) => {
    if (!confirm('Delete this question?')) return;
    try {
      await deleteDoc(doc(db, 'examQuestions', qId));
      fetchQuestions(selectedExamId);
    } catch (e) { console.error(e); }
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
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Select Exam</label>
        <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}
          className="w-full max-w-md rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]">
          <option value="">-- Choose an exam --</option>
          {exams.map(exam => (
            <option key={exam.id} value={exam.id}>{exam.title} ({exam.type})</option>
          ))}
        </select>
      </div>

      {selectedExamId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
              <div className="text-2xl font-bold text-white">{questions.length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Total Questions</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
              <div className="text-2xl font-bold text-blue-300">{mcqCount}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">MCQ</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
              <div className="text-2xl font-bold text-purple-300">{writtenCount}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Written</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
              <div className="text-2xl font-bold text-[#10B981]">{totalMarks}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Total Marks</div>
            </div>
          </div>

          {/* Add New Button */}
          {!addingNew && !editingId && (
            <button onClick={() => { resetForm(); setAddingNew(true); }}
              className="flex items-center gap-2 bg-[#2563EB] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-blue-500 transition-all mb-6 shadow-lg">
              <Plus className="h-4 w-4" /> Add Question
            </button>
          )}

          {/* Add/Edit Form */}
          {(addingNew || editingId) && (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">{editingId ? 'Edit Question' : 'Add New Question'}</h3>
                <button onClick={resetForm} className="text-slate-400 hover:text-white p-1"><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-4">
                {/* Question Type */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Question Type / প্রশ্নের ধরন</label>
                  <div className="flex gap-3">
                    <button onClick={() => setForm({ ...form, questionType: 'mcq' })}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${form.questionType === 'mcq' ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>MCQ</button>
                    <button onClick={() => setForm({ ...form, questionType: 'written' })}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${form.questionType === 'written' ? 'bg-purple-500 text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>Written</button>
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Question Text</label>
                  <textarea value={form.questionText} onChange={e => setForm({ ...form, questionText: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-slate-600" />
                </div>

                {/* MCQ Options */}
                {form.questionType === 'mcq' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Options</label>
                    {form.options?.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-400 w-6">{['A', 'B', 'C', 'D'][i]}</span>
                        <input value={opt} onChange={e => {
                          const opts = [...(form.options || [])];
                          opts[i] = e.target.value;
                          setForm({ ...form, options: opts });
                        }}
                          className="flex-grow rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#2563EB] placeholder:text-slate-600" />
                        <button onClick={() => setForm({ ...form, correctOption: i })}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${form.correctOption === i ? 'bg-[#10B981] text-white' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                          {form.correctOption === i ? 'Correct ✓' : 'Mark Correct'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Marks */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Marks</label>
                    <input type="number" min={0.5} step={0.5} value={form.marks} onChange={e => setForm({ ...form, marks: parseFloat(e.target.value) || 1 })}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-[#2563EB]" />
                  </div>
                </div>

                {/* Explanation (MCQ) */}
                {form.questionType === 'mcq' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Explanation (shown after exam)</label>
                    <textarea value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })}
                      rows={2}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-[#2563EB] placeholder:text-slate-600" />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 bg-[#10B981] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-500 transition-all disabled:opacity-50 shadow-lg">
                    <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Question'}
                  </button>
                  <button onClick={resetForm} className="text-slate-400 text-sm font-bold px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Questions List */}
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" /></div>
          ) : questions.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <p className="text-slate-500">No questions yet. Click "Add Question" to start.</p>
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
                        }`}>{q.questionType === 'mcq' ? 'MCQ' : 'Written'}</span>
                        <span className="text-[10px] text-slate-500">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
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
                        <p className="mt-1 text-[11px] text-slate-500 italic">Explanation: {q.explanation}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startEdit(q)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => q.id && handleDelete(q.id)} className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
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
          <p className="text-slate-500">Select an exam to manage its questions.</p>
        </div>
      )}
    </div>
  );
}
