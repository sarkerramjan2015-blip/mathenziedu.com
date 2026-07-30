import React, { useEffect, useState } from 'react';
import type { Exam } from '../lib/types';
import { getCountdownTarget, getExamStatus, getExamStatusLabel } from '../lib/examStatus';

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

interface ExamCountdownProps {
  exam: Exam;
  className?: string;
}

export default function ExamCountdown({ exam, className = '' }: ExamCountdownProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const status = getExamStatus(exam, now);
  const target = getCountdownTarget(exam, now);
  const remaining = target ? formatRemaining(target.getTime() - now.getTime()) : null;

  return (
    <div className={className}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {getExamStatusLabel(status)}
      </div>
      <div className="mt-1 font-mono text-xl font-bold text-white">
        {remaining || (status === 'schedule_missing' ? 'Schedule not configured' : getExamStatusLabel(status))}
      </div>
    </div>
  );
}
