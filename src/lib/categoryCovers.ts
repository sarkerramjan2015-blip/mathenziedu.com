import { fallbackCourseImage } from './media';

export const CATEGORY_COVER_MAP: Record<string, string> = {
  'Academic Maths': '/course-covers/standard-1-7-foundation-mathematics.png',
  Olympiad: '/course-covers/junior-math-olympiad-preparation.png',
  'Admission Course': '/course-covers/engineering-admission-math-crash-course.png',
  'Books Corner': '/course-covers/o-level-mathematics-preparation.png',
  'Mathematics and Nature': '/course-covers/hsc-higher-mathematics-foundation.png',
};

export function getCategoryCover(title: string, coverImage?: string) {
  const trimmed = coverImage?.trim();
  if (trimmed) return trimmed;
  return CATEGORY_COVER_MAP[title] || fallbackCourseImage;
}
