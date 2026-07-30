import { fallbackCourseImage } from './media';

export const COURSE_COVER_MAP: Record<string, string> = {
  'SSC Mathematics Complete Course': '/course-covers/ssc-mathematics-complete-course.png',
  'Standard One-Seven Foundation Mathematics': '/course-covers/standard-1-7-foundation-mathematics.png',
  'HSC Higher Mathematics Foundation': '/course-covers/hsc-higher-mathematics-foundation.png',
  'O Level Mathematics Preparation': '/course-covers/o-level-mathematics-preparation.png',
  'A Level Pure Mathematics Starter': '/course-covers/a-level-pure-mathematics-starter.png',
  'Junior Math Olympiad Preparation': '/course-covers/junior-math-olympiad-preparation.png',
  'Secondary Math Olympiad Problem Solving': '/course-covers/secondary-math-olympiad-problem-solving.png',
  'Engineering Admission Math Crash Course': '/course-covers/engineering-admission-math-crash-course.png',
};

function normalizeCourseTitle(title: string) {
  return title.replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
}

export function getMappedCourseCover(title: string) {
  return COURSE_COVER_MAP[normalizeCourseTitle(title)];
}

export function getCourseCover(title: string, existingImage?: string): string {
  const trimmedImage = existingImage?.trim();
  if (trimmedImage) return trimmedImage;
  return getMappedCourseCover(title) || fallbackCourseImage;
}
