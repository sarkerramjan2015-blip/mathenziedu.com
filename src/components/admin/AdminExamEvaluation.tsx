import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search, CheckCircle, XCircle, Clock, MessageSquare, Loader2, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { L } from '../../lib/i18n';
import type { ExamAttempt, WrittenSubmission, ExamQuestion, Exam } from '../../lib/types';

const STATUS_COLORS: Record<string, string> = {
  in_progress: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
  submitted: 'text-blue-400 bg-blue-500/10 border-blue-400/30',
  evaluated: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30',
  reviewed: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30',
};

interface AdminExamEvaluationProps {
  exams: Exam[];
}

export default function AdminExamEvaluation({ exams }: AdminExamEvaluationProps) {
  const [tab, setTab] = useState<'attempts' | 'written'>('attempts');
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [writtenSubs, setWrittenSubs] = useState<WrittenSubmission[]>([]);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [examFilter, setExamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [evalForm, setEvalForm] = useState<Record<string, { marks: string; feedback: string }>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attemptSnap, writtenSnap, questionSnap] = await Promise.all([
        getDocs(query(collection(db, 'examAttempts'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'writtenSubmissions'), orderBy('submittedAt', 'desc'))),
        getDocs(collection(db, 'examQuestions')),
      ]);
      setAttempts(attemptSnap.docs.map(d => ({ id: d.id, ...d.data() })) as ExamAttempt[]);
      setWrittenSubs(writtenSnap.docs.map(d => ({ id: d.id, ...d.data() })) as WrittenSubmission[]);
      setQuestions(questionSnap.docs.map(d => ({ id: d.id, ...d.data() })) as ExamQuestion[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleEvaluateWritten = async (sub: WrittenSubmission) => {
    const formKey = sub.id || '';
    const marks = parseFloat(evalForm[formKey]?.marks || '0');
    const feedback = evalForm[formKey]?.feedback || '';
    if (!sub.id) return;

    setSavingId(sub.id);
    try {
      await updateDoc(doc(db, 'writtenSubmissions', sub.id), {
        status: 'reviewed',
        marks,
        feedback,
        reviewedAt: Date.now(),
      });

      // Check if all written submissions for this attempt are reviewed
      const attemptSubs = writtenSubs.filter(s => s.attemptId === sub.attemptId);
      const allReviewed = attemptSubs.every(s => s.id === sub.id || s.status === 'reviewed');
      
      if (allReviewed && sub.attemptId) {
        // Sum marks from all reviewed submissions + the current one
        const totalWrittenMarks = attemptSubs.reduce((sum, s) => {
          if (s.id === sub.id) return sum + marks;
          return sum + (s.marks || 0);
        }, 0);

        const attempt = attempts.find(a => a.id === sub.attemptId);
        if (attempt) {
          const mcqMarks = attempt.obtainedMarks || 0;
          await updateDoc(doc(db, 'examAttempts', sub.attemptId), {
            status: 'evaluated',
            obtainedMarks: mcqMarks + totalWrittenMarks,
            updatedAt: Date.now(),
          });
        }
      }

      setEvalForm(prev => ({ ...prev, [formKey]: { marks: '', feedback: '' } }));
      fetchData();
    } catch (e) { console.error(e); alert('Error saving evaluation.'); }
    finally { setSavingId(null); }
  };

  const getQuestionsForExam = (examId: string) => questions.filter(q => q.examId === examId);

  const filteredAttempts = attempts.filter(a => {
    if (examFilter !== 'all' && a.examId !== examFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search && !a.userEmail.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredWritten = writtenSubs.filter(s => {
    if (examFilter !== 'all' && s.examId !== examFilter) return false;
    if (statusFilter !== 'all') {
      if (statusFilter === 'reviewed' && s.status !== 'reviewed') return false;
      if (statusFilter === 'submitted' && s.status !== 'submitted') return false;
    }
    if (search && !s.userEmail.toLowerCase().includes(search.toLowerCase()) && !s.answerText.toLowerCase().includes(search)) return false;
    return true;
  });

  if (loading) return <div className="text-slate-400 text-center py-12"><div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-3" />Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">{L.examEvaluation}</h2>
      <p className="mt-1 text-xs text-slate-400 mb-4">{L.evalHelp}</p>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setTab('attempts')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'attempts' ? 'bg-[#2563EB] text-white shadow-lg' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
          Exam Attempts ({attempts.length})
        </button>
        <button onClick={() => setTab('written')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'written' ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
          Written Submissions ({writtenSubs.length})
          {writtenSubs.filter(s => s.status === 'submitted').length > 0 && (
            <span className="ml-1.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{writtenSubs.filter(s => s.status === 'submitted').length}</span>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select value={examFilter} onChange={e => setExamFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]">
          <option value="all">All Exams</option>
          {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]">
          <option value="all">All Status</option>
          {tab === 'attempts' ? ['in_progress', 'submitted', 'evaluated'].map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          )) : ['submitted', 'reviewed'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email..."
            className="w-full sm:w-48 pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#2563EB] placeholder:text-slate-500" />
        </div>
      </div>

      {/* Exam Attempts Tab */}
      {tab === 'attempts' && (
        <div className="space-y-4">
          {filteredAttempts.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <Clock className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-500">No exam attempts found.</p>
            </div>
          )}
          {filteredAttempts.map(attempt => {
            const examQ = getQuestionsForExam(attempt.examId);
            return (
              <div key={attempt.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h4 className="font-bold text-white text-sm">{attempt.examTitle}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{attempt.userEmail} · {attempt.userId?.slice(-8)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[attempt.status] || ''}`}>
                    {attempt.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs">
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-[10px] text-slate-500">Marks</div>
                    <div className="font-bold text-white">{attempt.obtainedMarks ?? '—'} / {attempt.totalMarks}</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-[10px] text-slate-500">Correct</div>
                    <div className="font-bold text-[#10B981]">{attempt.correctCount ?? '—'}</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-[10px] text-slate-500">Wrong</div>
                    <div className="font-bold text-red-400">{attempt.wrongCount ?? '—'}</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-[10px] text-slate-500">Time Spent</div>
                    <div className="font-bold text-white">{Math.floor((attempt.timeSpent || 0) / 60)}m {(attempt.timeSpent || 0) % 60}s</div>
                  </div>
                </div>

                {/* View Answers Toggle */}
                <button onClick={() => setExpandedAttempt(expandedAttempt === attempt.id ? null : attempt.id || '')}
                  className="flex items-center gap-1 text-xs text-[#2563EB] font-bold hover:underline">
                  {expandedAttempt === attempt.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {expandedAttempt === attempt.id ? 'Hide Answers' : 'View Answers'}
                </button>

                {expandedAttempt === attempt.id && (
                  <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                    {attempt.answers.map((ans, idx) => {
                      const q = examQ.find(q => q.id === ans.questionId);
                      return (
                        <div key={idx} className="bg-black/20 rounded-xl p-4">
                          <div className="text-xs text-slate-400 mb-1">Q{idx + 1}. {q?.questionText || 'Question'}</div>
                          <div className="flex items-center gap-2">
                            {ans.questionType === 'mcq' ? (
                              <>
                                <span className="text-xs text-slate-300">Selected: <strong className="text-white">{['A', 'B', 'C', 'D'][ans.selectedOption ?? -1]}</strong></span>
                                {ans.isCorrect !== undefined && (
                                  ans.isCorrect
                                    ? <span className="text-[10px] text-[#10B981] flex items-center gap-0.5"><CheckCircle className="h-3 w-3" /> Correct</span>
                                    : <span className="text-[10px] text-red-400 flex items-center gap-0.5"><XCircle className="h-3 w-3" /> Wrong</span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-slate-300">Answer: <span className="text-white">{ans.answerText?.substring(0, 100)}{(ans.answerText?.length || 0) > 100 ? '...' : ''}</span></span>
                            )}
                          </div>
                          {q?.questionType === 'mcq' && q?.explanation && attempt.status === 'evaluated' && (
                            <p className="mt-1 text-[11px] text-slate-500 italic">Explanation: {q.explanation}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Written Submissions Tab */}
      {tab === 'written' && (
        <div className="space-y-4">
          {filteredWritten.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <FileText className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-500">No written submissions found.</p>
            </div>
          )}
          {filteredWritten.map(sub => {
            const formKey = sub.id || '';
            const q = questions.find(q => q.id === sub.questionId);
            return (
              <div key={sub.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h4 className="font-bold text-white text-sm">{sub.examTitle}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{sub.userEmail} · {sub.questionText.substring(0, 60)}...</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[sub.status] || ''}`}>
                    {sub.status}
                  </span>
                </div>

                {/* Answer Text */}
                <div className="bg-black/20 rounded-xl p-4 mb-4">
                  <div className="text-[10px] text-slate-500 mb-1">Student's Answer</div>
                  <p className="text-sm text-white whitespace-pre-wrap">{sub.answerText}</p>
                </div>

                {sub.status === 'submitted' ? (
                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Marks (out of {sub.maxMarks || q?.marks || '?'})</label>
                        <input type="number" min={0} max={sub.maxMarks || q?.marks || 100} step={0.5}
                          value={evalForm[formKey]?.marks || ''}
                          onChange={e => setEvalForm(prev => ({ ...prev, [formKey]: { ...prev[formKey], marks: e.target.value, feedback: prev[formKey]?.feedback || '' } }))}
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#2563EB]" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Feedback</label>
                      <textarea value={evalForm[formKey]?.feedback || ''}
                        onChange={e => setEvalForm(prev => ({ ...prev, [formKey]: { ...prev[formKey], marks: prev[formKey]?.marks || '', feedback: e.target.value } }))}
                        rows={2}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#2563EB] placeholder:text-slate-600" />
                    </div>
                    <button onClick={() => handleEvaluateWritten(sub)} disabled={savingId === sub.id}
                      className="flex items-center gap-2 bg-[#10B981] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-500 transition-all disabled:opacity-50">
                      {savingId === sub.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      {savingId === sub.id ? 'Saving...' : 'Save Evaluation'}
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-white/10 pt-4 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/20 rounded-lg p-3">
                        <div className="text-[10px] text-slate-500">Marks Given</div>
                        <div className="font-bold text-[#10B981]">{sub.marks ?? '—'} / {sub.maxMarks || q?.marks || '?'}</div>
                      </div>
                      <div className="bg-black/20 rounded-lg p-3">
                        <div className="text-[10px] text-slate-500">Reviewed At</div>
                        <div className="font-bold text-white text-xs">{sub.reviewedAt ? new Date(sub.reviewedAt).toLocaleString('en-BD') : '—'}</div>
                      </div>
                    </div>
                    {sub.feedback && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-blue-300 mt-0.5 shrink-0" />
                        <span className="text-xs text-blue-200">{sub.feedback}</span>
                      </div>
                    )}
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
