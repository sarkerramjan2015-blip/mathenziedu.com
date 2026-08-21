import type React from 'react';

const fallbackSvg = `
<svg width="1200" height="720" viewBox="0 0 1200 720" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="720" fill="#0F172A"/>
  <rect x="60" y="60" width="1080" height="600" rx="42" fill="#17213A"/>
  <path d="M0 520C190 430 315 455 475 525C665 608 790 606 1200 455V720H0V520Z" fill="#10B981" fill-opacity=".28"/>
  <path d="M0 120C190 215 366 175 548 118C744 56 944 61 1200 184V0H0V120Z" fill="#2563EB" fill-opacity=".35"/>
  <g opacity=".28" stroke="#F8FAFC" stroke-width="10" stroke-linecap="round">
    <path d="M390 214H810"/>
    <path d="M468 303H732"/>
    <path d="M524 392H676"/>
  </g>
  <text x="600" y="352" text-anchor="middle" fill="#F8FAFC" font-family="Inter, Arial, sans-serif" font-size="78" font-weight="800">Mathenzi Edu</text>
  <text x="600" y="422" text-anchor="middle" fill="#A7F3D0" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700">Mathematics Learning Platform</text>
</svg>`;

export const fallbackCourseImage = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fallbackSvg)}`;

export function imageWithFallback(image?: string) {
  return image && image.trim() ? image : fallbackCourseImage;
}

export function applyImageFallback(event: React.SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.src !== fallbackCourseImage) {
    image.src = fallbackCourseImage;
  }
}

export function formatCurrency(amount: number) {
  return amount === 0 ? 'Free' : `৳${amount.toLocaleString('en-BD')}`;
}
