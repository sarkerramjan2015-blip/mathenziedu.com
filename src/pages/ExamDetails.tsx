import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { exams } from '../lib/data';
import { Calendar, Clock, FileText, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../lib/media';

export default function ExamDetails() {
  const { id } = useParams();
  const [registered, setRegistered] = useState(false);
  const exam = exams.find(e => e.id === id);

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

  return (
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
              <div className="flex gap-3 mb-6">
                <span className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#10B981]/20 border border-[#10B981]/30 text-[#10B981] backdrop-blur-sm">
                  {exam.type} format
                </span>
                <span className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/10 border border-white/20 backdrop-blur-sm text-slate-200">
                  {exam.category}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-bold mb-4">{exam.title}</h1>
            </div>
          </div>

          <div className="px-8 md:px-12 pb-12 relative -mt-8 md:-mt-12 z-20">
            {/* Info Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 flex flex-col items-center justify-center text-center">
                <Calendar className="h-8 w-8 text-[#2563EB] mb-3" />
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Date</div>
                <div className="font-semibold text-white">{exam.date}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 flex flex-col items-center justify-center text-center">
                <Clock className="h-8 w-8 text-[#F59E0B] mb-3" />
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Duration</div>
                <div className="font-semibold text-white">{exam.duration}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 flex flex-col items-center justify-center text-center">
                <CheckCircle className="h-8 w-8 text-[#10B981] mb-3" />
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Marks</div>
                <div className="font-semibold text-white">{exam.totalMarks}</div>
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
                      <span>Ensure stable internet connection before starting the exam. The timer cannot be paused.</span>
                    </li>
                    {exam.type === 'MCQ' && (
                      <li className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 bg-[#F59E0B] rounded-full shrink-0"></div>
                        <span>There is a 0.25 negative marking for each incorrect answer.</span>
                      </li>
                    )}
                    {exam.type === 'Written' && (
                      <li className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 bg-[#F59E0B] rounded-full shrink-0"></div>
                        <span>Answers must be scanned clearly and uploaded within the time limit as a single PDF.</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-inner">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Fee</div>
                <div className="text-3xl font-bold text-white mb-2">{formatCurrency(exam.fee)}</div>
                <div className="text-sm text-slate-400">Includes detailed solution sheet after the exam.</div>
              </div>
              <button onClick={() => setRegistered(true)} className="w-full sm:w-auto bg-[#10B981] hover:bg-emerald-500 text-[#0F172A] font-bold px-10 py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-lg">
                {registered ? 'Registration Saved' : 'Register Interest'}
              </button>
            </div>
            {registered && (
              <p className="mt-4 rounded-xl border border-[#10B981]/20 bg-[#10B981]/10 px-4 py-3 text-sm font-medium text-[#10B981]">
                Registration interest saved locally. Connect payment gateway before accepting live exam fees.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
