import React, { useState } from 'react';
import { exams } from '../lib/data';
import { Calendar, Clock, FileText, CheckCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/media';

export default function Exams() {
  const [filter, setFilter] = useState('All');
  const examTypes = ['All', 'MCQ', 'Written'];
  
  const filteredExams = filter === 'All' ? exams : exams.filter(e => e.type === filter);

  return (
    <div className="min-h-screen py-12 relative z-10 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Upcoming Exams</h1>
          <p className="text-slate-400 text-lg max-w-2xl">Prepare for reality. Test your skills with our standard and model test exams.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-10">
          {examTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all backdrop-blur-sm ${
                filter === type 
                  ? 'bg-white text-[#0F172A] shadow-lg border border-white' 
                  : 'bg-white/5 text-slate-300 border border-white/10 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              {type} Exams
            </button>
          ))}
        </div>

        {/* Exams List */}
        <div className="space-y-6">
          {filteredExams.map((exam) => (
            <div key={exam.id} className="bg-white/5 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all flex flex-col md:flex-row gap-8 items-start md:items-center shadow-xl">
              
              <div className="flex-grow">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    exam.type === 'MCQ' ? 'bg-[#2563EB]/20 text-blue-300 border border-[#2563EB]/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {exam.type}
                  </span>
                  <span className="px-3 py-1 rounded bg-black/30 text-slate-300 text-xs font-medium uppercase tracking-wider border border-white/5">
                    {exam.category}
                  </span>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-5">{exam.title}</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#10B981]" />
                    <span className="font-medium text-slate-200">{exam.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#F59E0B]" />
                    <span>{exam.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span>{exam.syllabus.split(',')[0]}...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#2563EB]" />
                    <span><strong className="text-white">{exam.totalMarks}</strong> Marks</span>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-auto flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 bg-black/20 p-6 rounded-2xl border border-white/5 shrink-0">
                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-1 font-medium tracking-widest uppercase">Fee</div>
                  <div className="text-3xl font-display font-medium text-white">{formatCurrency(exam.fee)}</div>
                </div>
                <Link to={`/exams/${exam.id}`} className="bg-[#10B981] hover:bg-emerald-500 text-[#0F172A] px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap flex items-center justify-center gap-2">
                  Register <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
