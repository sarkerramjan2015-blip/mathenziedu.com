import type { Timestamp } from 'firebase/firestore';
import type { Exam } from './types';

export type ExamComputedStatus =
  | 'registration_not_open'
  | 'registration_open'
  | 'registration_closed'
  | 'live'
  | 'ended'
  | 'schedule_missing';

type DateLike = Date | Timestamp | number | string | undefined;

export function toDate(value: DateLike): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if ('toDate' in value && typeof value.toDate === 'function') return value.toDate();
  return null;
}

export function parseDurationMinutes(duration?: string) {
  const match = duration?.match(/(\d+)/);
  return match ? Number(match[1]) : 60;
}

export function getExamDurationMinutes(exam: Pick<Exam, 'duration' | 'durationMinutes'>) {
  return exam.durationMinutes && exam.durationMinutes > 0 ? exam.durationMinutes : parseDurationMinutes(exam.duration);
}

export function getExamEndAt(exam: Pick<Exam, 'scheduledStartAt' | 'duration' | 'durationMinutes'>) {
  const start = toDate(exam.scheduledStartAt);
  if (!start) return null;
  return new Date(start.getTime() + getExamDurationMinutes(exam) * 60 * 1000);
}

export function getExamStatus(exam: Exam, now = new Date()): ExamComputedStatus {
  if (exam.statusOverride && exam.statusOverride !== 'auto') {
    if (exam.statusOverride === 'upcoming') return 'registration_open';
    return exam.statusOverride;
  }

  const registrationOpenAt = toDate(exam.registrationOpenAt);
  const registrationCloseAt = toDate(exam.registrationCloseAt);
  const scheduledStartAt = toDate(exam.scheduledStartAt);
  const endAt = getExamEndAt(exam);

  if (!registrationOpenAt || !registrationCloseAt || !scheduledStartAt || !endAt) return 'schedule_missing';
  const time = now.getTime();
  if (time < registrationOpenAt.getTime()) return 'registration_not_open';
  if (time < registrationCloseAt.getTime()) return 'registration_open';
  if (time < scheduledStartAt.getTime()) return 'registration_closed';
  if (time < endAt.getTime()) return 'live';
  return 'ended';
}

export function getCountdownTarget(exam: Exam, now = new Date()) {
  const status = getExamStatus(exam, now);
  if (status === 'registration_not_open') return toDate(exam.registrationOpenAt);
  if (status === 'registration_open' || status === 'registration_closed') return toDate(exam.scheduledStartAt);
  if (status === 'live') return getExamEndAt(exam);
  return null;
}

export function getExamStatusLabel(status: ExamComputedStatus) {
  const labels: Record<ExamComputedStatus, string> = {
    registration_not_open: 'Registration Opens In / রেজিস্ট্রেশন শুরু হবে',
    registration_open: 'Starts In / শুরু হতে বাকি',
    registration_closed: 'Starts In / শুরু হতে বাকি',
    live: 'Exam Live / পরীক্ষা চলছে',
    ended: 'Exam Ended / পরীক্ষা শেষ',
    schedule_missing: 'Schedule not configured',
  };
  return labels[status];
}

export function formatDhakaDateTime(value: DateLike) {
  const date = toDate(value);
  if (!date) return 'Schedule not configured';
  return new Intl.DateTimeFormat('en-BD', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatDurationLabel(minutes: number) {
  return `${minutes} Mins`;
}
