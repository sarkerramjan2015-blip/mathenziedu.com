import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { exams as staticExams } from '../lib/data';
import { useAuth } from '../lib/AuthContext';
import { DEMO_MODE, addDemoLocalData, isPermissionError } from '../lib/demo';
import { Calendar, Clock, FileText, CheckCircle, ChevronRight, AlertCircle, Loader2, HelpCircle, Edit3, Play } from 'lucide-react';
import { formatCurrency } from '../lib/media';
import SEO from '../components/SEO';
import BkashPaymentSection from '../components/BkashPaymentSection';
import type { ExamQuestion, ExamAttempt, Order } from '../lib/types';

export default function ExamDetails() {
  const { id } = useParams();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const exam = staticExams.find(e => e.id === id);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [existingAttempt, setExistingAttempt] = useState<ExamAttempt | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [creatingAttempt, setCreatingAttempt] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const q = query(collection(db, 'examQuestions'), where('examId', '==', id), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ExamQuestion[]);

        if (user) {
          // Check existing attempts
          const attSnap = await getDocs(query(
            collection(db, 'examAttempts'),
            where('examId', '==', id),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          ));
          if (!attSnap.empty) {
            setExistingAttempt(attSnap.docs[0].data() as ExamAttempt);
          }

          // Check existing orders for this exam
          const ordSnap = await getDocs(query(
            collection(db, 'orders'),
            where('itemId', '==', id),
            where('itemType', '==', 'exam'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          ));
          if (!ordSnap.empty) {
            setOrder({ id: ordSnap.docs[0].id, ...ordSnap.docs[0].data() } as Order);
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoadingQuestions(false); }
    };
    fetchData();
  }, [id, user]);

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-4">Exam not found</h1>
          <Link to="/exams" className="text-[#10B981] font-bold hover:text-emerald-300">Back to exams</Link>
        </div>
      </div>
    );
  }

  const isFree = exam.fee === 0;
  const mcqCount = questions.filter(q => q.questionType === 'mcq').length;
  const writtenCount = questions.filter(q => q.questionType === 'written').length;
  const totalQCount = questions.length;
  const examTypeLabel = mcqCount > 0 && writtenCount > 0 ? 'Mixed (MCQ + Written)' : exam.type === 'MCQ' ? 'MCQ' : 'Written';

  const canAccess = isFree || (order?.status === 'paid');

  const handleStartExam = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/exams/${id}/take` } });
      return;
    }
    if (!canAccess && !isFree) {
      setShowPayment(true);
      return;
    }

    setCreatingAttempt(true);
    try {
      const now = Date.now();
      const attemptData = {
        userId: user.uid,
        userEmail: user.email || '',
        examId: id || '',
        examTitle: exam.title,
        status: 'in_progress',
        startedAt: now,
        totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
        answers: [],
        timeSpent: 0,
        createdAt: now,
        updatedAt: now,
      };
      try {
        const docRef = await addDoc(collection(db, 'examAttempts'), attemptData);
        navigate(`/exams/${id}/take?attempt=${docRef.id}`);
      } catch (e) {
        if (DEMO_MODE && isPermissionError(e)) {
          const savedAttempt = addDemoLocalData('examAttempts', attemptData);
          navigate(`/exams/${id}/take?attempt=${savedAttempt.id}`);
          return;
        }
        throw e;
      }
    } catch (e) {
      console.error(e);
      alert('Error starting exam. Please try again.');
    } finally {
      setCreatingAttempt(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!user) return;
    try {
      const orderData = {
        userId: user.uid,
        userEmail: user.email || '',
        itemType: 'exam',
        itemId: id || '',
        itemTitle: exam.title,
        amount: exam.fee,
        currency: 'BDT' as const,
        status: 'pending',
        paymentMethod: 'bkash_manual',
        createdAt: Date.now(),
      };
      try {
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        setOrder({ id: docRef.id, ...orderData });
      } catch (e) {
        if (DEMO_MODE && isPermissionError(e)) {
          const savedOrder = addDemoLocalData('orders', orderData) as Order;
          setOrder(savedOrder);
          setShowPayment(true);
          return;
        }
        throw e;
      }
      setShowPayment(true);
    } catch (e) { console.error(e); }
  };

  return (
    <>
      <SEO
        title={`${exam.title} - Mathemzi Edu`}
        description={`${exam.type} exam: ${exam.duration}, ${exam.totalMarks} marks. ${exam.syllabus}`}
        path={`/exams/${id}`}
      />
      <div className="min-h-screen py-12 relative z-10 w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-2 text-sm font-medium mb-8 text-slate-400">
          <Link to="/exams" className="hover:text-white transition-colors">Exams</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-[#2563EB]">{exam.title}</span>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 overflow-hidden shadow-2xl relative">
          {/* Header */}
          <div className="p-8 md:p-12 pb-16 md:pb-24 pt-12 md:pt-16 border-b border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/20 to-[#10B981]/10 opacity-50 mix-blend-overlay"></div>
            <div className="relative z-10 text-white">
              <div className="flex gap-3 mb-6 flex-wrap">
                <span className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#10B981]/20 border border-[#10B981]/30 text-[#10B981] backdrop-blur-sm">
                  {examTypeLabel}
                </span>
                <span className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/10 border border-white/20 backdrop-blur-sm text-slate-200">
                  {exam.mainCategory || exam.category}
                </span>
                {exam.subCategory && (
                  <span className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm text-blue-300">
                    {exam.subCategory}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-bold mb-4">{exam.title}</h1>
            </div>
          </div>

          <div className="px-8 md:px-12 pb-12 relative -mt-8 md:-mt-12 z-20">
            {/* Info Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 flex flex-col items-center justify-center text-center">
                <Calendar className="h-8 w-8 text-[#2563EB] mb-3" />
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Date</div>
                <div className="font-semibold text-white text-sm">{exam.date}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 flex flex-col items-center justify-center text-center">
                <Clock className="h-8 w-8 text-[#F59E0B] mb-3" />
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Duration</div>
                <div className="font-semibold text-white text-sm">{exam.duration}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 flex flex-col items-center justify-center text-center">
                <CheckCircle className="h-8 w-8 text-[#10B981] mb-3" />
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Marks</div>
                <div className="font-semibold text-white text-sm">{exam.totalMarks}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 flex flex-col items-center justify-center text-center">
                <HelpCircle className="h-8 w-8 text-blue-400 mb-3" />
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Questions</div>
                <div className="font-semibold text-white text-sm">{loadingQuestions ? '...' : `${totalQCount} (${mcqCount} MCQ, ${writtenCount} Written)`}</div>
              </div>
              <div className="bg-[#2563EB]/20 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-[#2563EB]/30 flex flex-col items-center justify-center text-center">
                <AlertCircle className="h-8 w-8 text-white mb-3" />
                <div className="text-xs text-blue-200 font-bold uppercase tracking-wider mb-1">Fee</div>
                <div className="font-bold text-white text-xl">{formatCurrency(exam.fee)}</div>
              </div>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-display font-bold text-white mb-6">Syllabus & Instructions</h2>
              <div className="bg-black/20 rounded-2xl p-6 md:p-8 border border-white/5 text-slate-300 leading-relaxed space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Subject Syllabus</h3>
                  <p className="text-lg text-white font-medium">{exam.syllabus}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Exam Rules</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 bg-[#F59E0B] rounded-full shrink-0"></div>
                      <span>Calculators are {exam.type === 'MCQ' ? 'not allowed' : 'allowed'} for this exam.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 bg-[#F59E0B] rounded-full shrink-0"></div>
                      <span>Ensure stable internet connection before starting. The timer cannot be paused.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 bg-[#F59E0B] rounded-full shrink-0"></div>
                      <span>Read all instructions carefully. You can review answers before final submission.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Start Exam / Payment Section */}
            {showPayment && !canAccess ? (
              <div className="space-y-4">
                {order ? (
                  <>
                    <div className="rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/10 p-4 text-sm text-[#F59E0B] flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> This is a paid exam. Complete payment to access it.
                    </div>
                    <BkashPaymentSection
                      order={order}
                      userId={user?.uid || ''}
                      userEmail={user?.email || ''}
                      onSubmitted={() => setShowPayment(false)}
                    />
                  </>
                ) : (
                  <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-inner">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Fee</div>
                      <div className="text-3xl font-bold text-white mb-2">{formatCurrency(exam.fee)}</div>
                      <div className="text-sm text-slate-400">Pay to access this exam.</div>
                    </div>
                    <button onClick={handleCreateOrder} disabled={!user}
                      className="w-full sm:w-auto bg-[#10B981] hover:bg-emerald-500 text-[#0F172A] font-bold px-10 py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-lg disabled:opacity-50">
                      {user ? 'Pay & Access Exam' : 'Login to Access'}
                    </button>
                  </div>
                )}
              </div>
            ) : existingAttempt ? (
              <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-inner">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Your Attempt</div>
                  <div className="text-lg font-bold text-white mb-1">
                    Status: <span className={`${existingAttempt.status === 'evaluated' ? 'text-[#10B981]' : existingAttempt.status === 'submitted' ? 'text-blue-400' : 'text-[#F59E0B]'}`}>
                      {existingAttempt.status === 'evaluated' ? 'Evaluated' : existingAttempt.status === 'submitted' ? 'Submitted' : 'In Progress'}
                    </span>
                  </div>
                  {existingAttempt.obtainedMarks !== undefined && (
                    <div className="text-sm text-slate-400">Score: {existingAttempt.obtainedMarks} / {existingAttempt.totalMarks}</div>
                  )}
                </div>
                {existingAttempt.status === 'in_progress' && (
                  <Link to={`/exams/${id}/take?attempt=${existingAttempt.id}`}
                    className="w-full sm:w-auto bg-[#2563EB] hover:bg-blue-500 text-white font-bold px-10 py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 text-lg text-center">
                    Continue Exam
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-inner">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Ready to Test Yourself?</div>
                  <div className="text-xl font-bold text-white mb-1">
                    {totalQCount > 0 ? `${totalQCount} Questions · ${exam.totalMarks} Marks` : 'No questions loaded yet'}
                  </div>
                  <div className="text-sm text-slate-400">{isFree ? 'Free exam — start anytime' : `Fee: ${formatCurrency(exam.fee)}`}</div>
                </div>
                {totalQCount === 0 && !loadingQuestions ? (
                  <div className="text-sm text-slate-500">No questions available for this exam yet.</div>
                ) : (
                  <button onClick={handleStartExam} disabled={creatingAttempt || loadingQuestions}
                    className="w-full sm:w-auto bg-[#10B981] hover:bg-emerald-500 text-[#0F172A] font-bold px-10 py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-lg disabled:opacity-50 flex items-center justify-center gap-2">
                    {creatingAttempt ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                    {creatingAttempt ? 'Preparing...' : 'Start Exam'}
                  </button>
                )}
              </div>
            )}

            {!user && (
              <p className="mt-4 text-sm text-slate-500 text-center">
                <Link to="/login" className="text-[#2563EB] font-bold hover:underline">Login</Link> or <Link to="/register" className="text-[#2563EB] font-bold hover:underline">Register</Link> to start the exam.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
