import { fallbackCourseImage } from './media';

export const EXAM_COVER_MAP: Record<string, string> = {
  'SSC Mathematics Model Test 2026': '/course-covers/ssc-mathematics-complete-course.png',
  'HSC Higher Math MCQ Practice': '/course-covers/hsc-higher-mathematics-foundation.png',
  'Junior Olympiad Mock Test': '/course-covers/junior-math-olympiad-preparation.png',
  'Secondary Olympiad Problem Solving Test': '/course-covers/secondary-math-olympiad-problem-solving.png',
  'Engineering Admission Math Practice Test': '/course-covers/engineering-admission-math-crash-course.png',
};

export function getExamCover(title: string, coverImage?: string) {
  const trimmed = coverImage?.trim();
  if (trimmed) return trimmed;
  return EXAM_COVER_MAP[title] || fallbackCourseImage;
}
