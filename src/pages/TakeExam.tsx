import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { collection, getDocs, query, where, getDoc, doc, updateDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { exams as staticExams } from '../lib/data';
import { useAuth } from '../lib/AuthContext';
import { DEMO_MODE, addDemoLocalData, updateDemoLocalData, isPermissionError } from '../lib/demo';
import { Clock, AlertCircle, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight, Send, HelpCircle } from 'lucide-react';
import SEO from '../components/SEO';
import type { ExamQuestion, ExamAttempt, ExamAnswer, Exam } from '../lib/types';
import { getExamDurationMinutes, getExamStatus } from '../lib/examStatus';

function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)/);
  if (match) return parseInt(match[1]) * 60; // convert minutes to seconds
  return 3600; // default 1 hour
}

function toExamAnswer(
  question: ExamQuestion,
  answer?: { selectedOption?: number; answerText?: string },
): ExamAnswer {
  const result: ExamAnswer = {
    questionId: question.id || '',
    questionType: question.questionType,
  };
  if (typeof answer?.selectedOption === 'number') result.selectedOption = answer.selectedOption;
  if (typeof answer?.answerText === 'string') result.answerText = answer.answerText;
  return result;
}

export default function TakeExam() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attempt');
  const { user } = useAuth();

  const [exam, setExam] = useState<Exam | null>(() => staticExams.find(e => e.id === id) || null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, 'exams', id), (snapshot) => {
      if (snapshot.exists()) setExam({ id: snapshot.id, ...snapshot.data() } as Exam);
      else setExam(staticExams.find(e => e.id === id) || null);
    }, () => setExam(staticExams.find(e => e.id === id) || null));
    return unsubscribe;
  }, [id]);

  // Answers state
  const [answers, setAnswers] = useState<Record<string, { selectedOption?: number; answerText?: string }>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  // Results
  const [results, setResults] = useState<{
    correct: number; wrong: number; obtainedMarks: number; totalMarks: number;
  } | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    const fetchData = async () => {
      try {
        // Fetch questions
        const qSnap = await getDocs(query(collection(db, 'examQuestions'), where('examId', '==', id)));
        const qList = qSnap.docs
          .map(document => ({ id: document.id, ...document.data() }) as ExamQuestion)
          .sort((a, b) => a.order - b.order);
        setQuestions(qList);

        if (attemptId) {
          const attSnap = await getDoc(doc(db, 'examAttempts', attemptId));
          if (attSnap.exists()) {
            const attData = { id: attSnap.id, ...attSnap.data() } as ExamAttempt;
            if (attData.userId !== user.uid || attData.examId !== id) {
              setError('This exam attempt does not match your account or the selected exam.');
              return;
            }
            setAttempt(attData);

            // Restore answers from existing attempt
            if (attData.answers && attData.answers.length > 0) {
              const restored: Record<string, { selectedOption?: number; answerText?: string }> = {};
              attData.answers.forEach(a => {
                restored[a.questionId] = {
                  selectedOption: a.selectedOption,
                  answerText: a.answerText,
                };
              });
              setAnswers(restored);
            }

            if (attData.status === 'submitted' || attData.status === 'evaluated') {
              setSubmitted(true);
              if (attData.obtainedMarks !== undefined) {
                setResults({
                  correct: attData.correctCount || 0,
                  wrong: attData.wrongCount || 0,
                  obtainedMarks: attData.obtainedMarks || 0,
                  totalMarks: attData.totalMarks,
                });
              }
            } else {
              const examStatus = exam ? getExamStatus(exam) : 'schedule_missing';
              if (examStatus !== 'live') {
                setError(examStatus === 'ended' ? 'Exam has ended.' : 'Exam is not live right now.');
                return;
              }
              // Calculate remaining time
              const durationSec = exam ? getExamDurationMinutes(exam) * 60 : parseDuration('60 Mins');
              const elapsed = Math.floor((Date.now() - attData.startedAt) / 1000);
              const remaining = Math.max(0, durationSec - elapsed);
              setTimeLeft(remaining);
              setStartTime(attData.startedAt);
            }
          }
        } else {
          setError('No exam attempt found. Please start the exam from the exam page.');
        }
      } catch (e) { console.error(e); setError('Error loading exam.'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id, user, attemptId, exam]);

  const handleSubmitRef = useRef<(autoSubmit: boolean) => Promise<void>>(async () => {});

  // Update time spent periodically
  useEffect(() => {
    if (!startTime || submitted) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (attemptId) {
        try {
          updateDoc(doc(db, 'examAttempts', attemptId), { timeSpent: elapsed, updatedAt: Date.now() }).catch(() => {});
        } catch {
          if (DEMO_MODE) {
            updateDemoLocalData('examAttempts', attemptId, { timeSpent: elapsed, updatedAt: Date.now() });
          }
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [startTime, submitted, attemptId]);

  // Save answers shortly after each change so a refresh does not erase the student's work.
  useEffect(() => {
    if (!attemptId || !attempt || attempt.status !== 'in_progress' || submitted || questions.length === 0 || Object.keys(answers).length === 0) return;

    const timeout = window.setTimeout(async () => {
      const savedAnswers = questions.map(question => toExamAnswer(question, answers[question.id || '']));

      try {
        await updateDoc(doc(db, 'examAttempts', attemptId), {
          answers: savedAnswers,
          updatedAt: Date.now(),
        });
      } catch (saveError) {
        if (DEMO_MODE && isPermissionError(saveError)) {
          updateDemoLocalData('examAttempts', attemptId, { answers: savedAnswers, updatedAt: Date.now() });
        }
      }
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [answers, attempt, attemptId, questions, submitted]);

  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress' || submitted) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [attempt, submitted]);

  const handleAnswer = (questionId: string, value: { selectedOption?: number; answerText?: string }) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!attemptId || !user || !exam || questions.length === 0) return;

    setSubmitting(true);
    setError('');

    try {
      // Build answers array
      const answeredList = questions.map(question => toExamAnswer(question, answers[question.id || '']));

      // Auto-evaluate MCQ
      let mcqMarks = 0;
      let correctCount = 0;
      let wrongCount = 0;
      const evaluatedAnswers = answeredList.map(ans => {
        const q = questions.find(q => q.id === ans.questionId);
        if (q?.questionType === 'mcq' && q.correctOption !== undefined) {
          const isCorrect = ans.selectedOption === q.correctOption;
          if (isCorrect) {
            mcqMarks += q.marks;
            correctCount++;
          } else if (ans.selectedOption !== undefined) {
            wrongCount++;
          }
          return { ...ans, isCorrect, marks: isCorrect ? q.marks : 0 };
        }
        return ans;
      });

      const hasWrittenQuestions = questions.some(q => q.questionType === 'written');
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

      const writtenQuestions = questions.filter(q => q.questionType === 'written');

      // Update the attempt
      const attemptRef = doc(db, 'examAttempts', attemptId);
      const updateData: Partial<ExamAttempt> = {
        answers: evaluatedAnswers,
        status: hasWrittenQuestions ? 'submitted' : 'evaluated',
        submittedAt: Date.now(),
        timeSpent,
        correctCount,
        wrongCount,
        obtainedMarks: mcqMarks,
        updatedAt: Date.now(),
      };

      try {
        const batch = writeBatch(db);
        batch.update(attemptRef, updateData as Record<string, unknown>);

        for (const writtenQuestion of writtenQuestions) {
          const submissionId = `${attemptId}_${writtenQuestion.id || 'written'}`;
          const submissionRef = doc(db, 'writtenSubmissions', submissionId);
          batch.set(submissionRef, {
            userId: user.uid,
            userEmail: user.email || '',
            examId: id || '',
            examTitle: exam.title,
            attemptId,
            questionId: writtenQuestion.id || '',
            questionText: writtenQuestion.questionText,
            answerText: answers[writtenQuestion.id || '']?.answerText || '',
            status: 'submitted',
            maxMarks: writtenQuestion.marks,
            submittedAt: Date.now(),
          });
        }

        await batch.commit();
      } catch (e) {
        if (DEMO_MODE && isPermissionError(e)) {
          updateDemoLocalData('examAttempts', attemptId, updateData as any);
          for (const writtenQuestion of writtenQuestions) {
            addDemoLocalData('writtenSubmissions', {
              id: `${attemptId}_${writtenQuestion.id || 'written'}`,
              userId: user.uid,
              userEmail: user.email || '',
              examId: id || '',
              examTitle: exam.title,
              attemptId,
              questionId: writtenQuestion.id || '',
              questionText: writtenQuestion.questionText,
              answerText: answers[writtenQuestion.id || '']?.answerText || '',
              status: 'submitted',
              maxMarks: writtenQuestion.marks,
              submittedAt: Date.now(),
            });
          }
        } else {
          throw e;
        }
      }

      setResults({
        correct: correctCount,
        wrong: wrongCount,
        obtainedMarks: mcqMarks,
        totalMarks,
      });
      setSubmitted(true);
      setShowConfirm(false);

      if (timerRef.current) clearInterval(timerRef.current);
    } catch (e) {
      console.error(e);
      setError('Error submitting exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Assign to ref after definition
  handleSubmitRef.current = handleSubmit;

  // Timer countdown
  useEffect(() => {
    if (submitted || timeLeft <= 0 || !attempt || attempt.status !== 'in_progress') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [submitted, attempt?.status]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && attempt?.status === 'in_progress' && !submitted && questions.length > 0) {
      handleSubmitRef.current(true);
    }
  }, [timeLeft]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 max-w-md">
          <AlertCircle className="h-12 w-12 text-[#F59E0B] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-slate-400 mb-6">Please log in to take this exam.</p>
          <Link to="/login" state={{ from: `/exams/${id}/take` }}
            className="inline-block bg-[#2563EB] text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-500 transition-all shadow-lg">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link to="/exams"
            className="inline-block bg-[#2563EB] text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-500 transition-all shadow-lg">
            Back to Exams
          </Link>
        </div>
      </div>
    );
  }

  if (!exam || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-4">Exam not found</h1>
          <Link to="/exams" className="text-[#10B981] font-bold hover:text-emerald-300">Back to exams</Link>
        </div>
      </div>
    );
  }

  // Result screen
  if (submitted && results) {
    const hasWritten = questions.some(q => q.questionType === 'written');
    return (
      <>
        <SEO title={`Results: ${exam.title} - Mathemzi Edu`} description={`Exam results for ${exam.title}`} path={`/exams/${id}/take`} />
        <div className="min-h-screen py-12 relative z-10 w-full">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-8 md:p-12 text-center">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-[#10B981]/20 border border-[#10B981]/30 mb-6">
                  <CheckCircle className="h-10 w-10 text-[#10B981]" />
                </div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">Exam Submitted!</h1>
                <p className="text-slate-400 mb-8">{hasWritten ? 'Your written answers are under review. MCQ results are shown below.' : 'Your exam has been evaluated.'}</p>

                {/* Score Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <div className="text-3xl font-bold text-white">{results.totalMarks}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Marks</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <div className="text-3xl font-bold text-[#10B981]">{results.obtainedMarks}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Obtained</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <div className="text-3xl font-bold text-[#10B981]">{results.correct}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Correct</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <div className="text-3xl font-bold text-red-400">{results.wrong}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wrong</div>
                  </div>
                </div>

                {/* Questions Review */}
                <div className="text-left space-y-4">
                  <h3 className="font-bold text-white text-lg">Question Review</h3>
                  {questions.map((q, idx) => {
                    const ans = answers[q.id || ''];
                    const isCorrect = q.questionType === 'mcq' && ans?.selectedOption === q.correctOption;
                    const isWrong = q.questionType === 'mcq' && ans?.selectedOption !== undefined && ans.selectedOption !== q.correctOption;
                    return (
                      <div key={q.id} className={`bg-white/5 rounded-2xl p-5 border ${
                        isCorrect ? 'border-[#10B981]/30' : isWrong ? 'border-red-400/30' : 'border-white/10'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            {isCorrect ? <CheckCircle className="h-5 w-5 text-[#10B981]" /> : 
                             isWrong ? <XCircle className="h-5 w-5 text-red-400" /> : 
                             <HelpCircle className="h-5 w-5 text-slate-500" />}
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-slate-500">Q{idx + 1}.</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                q.questionType === 'mcq' ? 'bg-[#2563EB]/10 text-blue-300' : 'bg-purple-500/10 text-purple-300'
                              }`}>{q.questionType === 'mcq' ? 'MCQ' : 'Written'}</span>
                              <span className="text-xs text-slate-500">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                            </div>
                            <p className="text-sm text-white">{q.questionText}</p>
                            {q.questionType === 'mcq' && (
                              <div className="mt-2 space-y-1">
                                {q.options?.map((opt, i) => (
                                  <div key={i} className={`text-xs px-3 py-1.5 rounded-lg border ${
                                    i === q.correctOption ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]' :
                                    i === ans?.selectedOption && i !== q.correctOption ? 'border-red-400/30 bg-red-500/10 text-red-300' :
                                    'border-white/10 text-slate-400'
                                  }`}>
                                    {['A', 'B', 'C', 'D'][i]}. {opt}
                                    {i === q.correctOption && <span className="ml-2 text-[10px] font-bold">✓ Correct Answer</span>}
                                  </div>
                                ))}
                                {q.explanation && (
                                  <p className="mt-2 text-[11px] text-slate-400 italic bg-white/5 p-3 rounded-lg">
                                    <strong>Explanation:</strong> {q.explanation}
                                  </p>
                                )}
                              </div>
                            )}
                            {q.questionType === 'written' && (
                              <div className="mt-2 bg-black/20 rounded-xl p-3">
                                <div className="text-[10px] text-slate-500 mb-1">Your Answer:</div>
                                <p className="text-sm text-white whitespace-pre-wrap">{ans?.answerText || 'No answer provided'}</p>
                                {attempt.status === 'evaluated' && (
                                  <p className="mt-2 text-xs text-[#10B981]">
                                    Marks: {attempt.obtainedMarks !== undefined ? attempt.obtainedMarks : 'Awaiting evaluation'}
                                  </p>
                                )}
                                {attempt.status !== 'evaluated' && (
                                  <p className="mt-2 text-xs text-[#F59E0B]">Under Review — awaiting admin evaluation</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-wrap gap-4 justify-center">
                  <Link to="/exams" className="inline-flex items-center gap-2 bg-white/10 text-white font-bold px-6 py-3 rounded-xl border border-white/20 hover:bg-white/20 transition-all">
                    Browse More Exams
                  </Link>
                  <Link to="/dashboard" className="inline-flex items-center gap-2 bg-[#2563EB] text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-blue-500 transition-all">
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Exam taking interface
  const currentQuestion = questions[currentQuestionIndex];
  const durationSec = parseDuration(exam.duration);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const answeredCount = Object.keys(answers).length;
  const isTimerWarning = timeLeft < 300; // 5 minutes warning
  const isTimerCritical = timeLeft < 60;

  return (
    <>
      <SEO title={`Taking: ${exam.title} - Mathemzi Edu`} description={`Taking exam: ${exam.title}`} path={`/exams/${id}/take`} />
      <div className="min-h-screen relative z-10 w-full">
        {/* Top Timer Bar */}
        <div className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all ${
          isTimerCritical ? 'bg-red-900/40 border-red-500/30' : isTimerWarning ? 'bg-[#F59E0B]/10 border-[#F59E0B]/20' : 'bg-[#0F172A]/80 border-white/10'
        }`}>
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={`/exams/${id}`} className="text-slate-400 hover:text-white p-1">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">{exam.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-slate-400 hidden sm:block">
                {answeredCount}/{questions.length} answered
              </div>
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-sm font-mono ${
                isTimerCritical ? 'bg-red-500/20 text-red-300 border border-red-400/30 animate-pulse' : 
                isTimerWarning ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30' : 
                'bg-white/10 text-white border border-white/20'
              }`}>
                <Clock className="h-4 w-4" />
                <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-black/40">
            <div className="h-full bg-gradient-to-r from-[#2563EB] to-[#10B981] transition-all duration-500"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Question Navigator */}
          <div className="flex flex-wrap gap-2 mb-8">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id || '']?.selectedOption !== undefined || answers[q.id || '']?.answerText;
              return (
                <button key={q.id} onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold border transition-all ${
                    idx === currentQuestionIndex ? 'bg-[#2563EB] text-white border-[#2563EB]' :
                    isAnswered ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30' :
                    'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                  }`}>
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {currentQuestion && (
            <div className="bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-8 md:p-10">
                {/* Question Header */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-sm font-bold text-slate-500">Question {currentQuestionIndex + 1} of {questions.length}</span>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                    currentQuestion.questionType === 'mcq' ? 'bg-[#2563EB]/10 text-blue-300' : 'bg-purple-500/10 text-purple-300'
                  }`}>{currentQuestion.questionType === 'mcq' ? 'MCQ' : 'Written Question'}</span>
                  <span className="text-xs text-slate-500">{currentQuestion.marks} mark{currentQuestion.marks > 1 ? 's' : ''}</span>
                </div>

                {/* Question Text */}
                <h2 className="text-xl md:text-2xl font-bold text-white mb-8 leading-relaxed">
                  {currentQuestion.questionText}
                </h2>

                {/* MCQ Options */}
                {currentQuestion.questionType === 'mcq' && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((opt, i) => (
                      <button key={i} onClick={() => handleAnswer(currentQuestion.id || '', { selectedOption: i })}
                        className={`w-full text-left p-4 rounded-xl border transition-all text-sm ${
                          answers[currentQuestion.id || '']?.selectedOption === i
                            ? 'bg-[#2563EB]/20 border-[#2563EB]/50 text-white shadow-lg'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                        }`}>
                        <span className="font-bold mr-3">{['A', 'B', 'C', 'D'][i]}.</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Written Answer */}
                {currentQuestion.questionType === 'written' && (
                  <div>
                    <textarea
                      value={answers[currentQuestion.id || '']?.answerText || ''}
                      onChange={e => handleAnswer(currentQuestion.id || '', { answerText: e.target.value })}
                      rows={8}
                      placeholder="Write your answer here... Be clear and show your working steps if needed."
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-slate-600 resize-y min-h-[200px]"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      {(answers[currentQuestion.id || '']?.answerText?.length || 0)} characters
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="px-8 md:px-10 py-5 border-t border-white/10 flex items-center justify-between">
                <button onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft className="h-5 w-5" /> Previous
                </button>

                {currentQuestionIndex === questions.length - 1 ? (
                  <button onClick={() => setShowConfirm(true)}
                    disabled={submitting}
                    className="flex items-center gap-2 bg-[#10B981] hover:bg-emerald-500 text-[#0F172A] font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                    <Send className="h-4 w-4" /> {submitting ? 'Submitting...' : 'Submit Exam'}
                  </button>
                ) : (
                  <button onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg">
                    Next <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Confirmation Modal */}
          {showConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-[#0F172A] border border-white/10 rounded-[32px] p-8 max-w-md w-full shadow-2xl">
                <div className="text-center mb-6">
                  <AlertCircle className="h-12 w-12 text-[#F59E0B] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Submit Your Exam?</h3>
                  <p className="text-sm text-slate-400">
                    You have answered {answeredCount} out of {questions.length} questions. 
                    Once submitted, you cannot change your answers.
                  </p>
                </div>

                {questions.some(q => q.questionType === 'written' && !answers[q.id || '']?.answerText) && (
                  <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl p-4 mb-6 text-xs text-[#F59E0B] flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>You have unanswered written questions. You can still submit, but unanswered questions will receive no marks.</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setShowConfirm(false)}
                    className="flex-1 bg-white/10 text-white font-bold px-5 py-3 rounded-xl border border-white/20 hover:bg-white/20 transition-all text-sm">
                    Review Again
                  </button>
                  <button onClick={() => handleSubmit()} disabled={submitting}
                    className="flex-1 bg-[#10B981] hover:bg-emerald-500 text-[#0F172A] font-bold px-5 py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {submitting ? 'Submitting...' : 'Submit Now'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
