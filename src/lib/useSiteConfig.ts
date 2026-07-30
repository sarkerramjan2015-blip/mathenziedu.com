import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { SITE_CONFIG, BKASH_MANUAL, SOCIAL_LINKS, CONTACT_INFO } from './config';
import { DEMO_MODE } from './demo';
import type { SiteSettings } from './types';

// Merged site settings with config.ts as fallback
export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  banglaTagline: string;
  email: string;
  phone: string;
  address: string;
  supportHours: string;
  // Homepage
  heroTitle: string;
  heroSubtitle: string;
  heroBtn1Text: string;
  heroBtn1Link: string;
  heroBtn2Text: string;
  heroBtn2Link: string;
  heroBtn3Text: string;
  heroBtn3Link: string;
  trustSectionTitle: string;
  trustSectionItems: string[];
  // Payment
  bkashNumber: string;
  bkashAccountType: string;
  bkashInstructions: string[];
  paymentNote: string;
  // Social
  facebookUrl: string;
  youtubeUrl: string;
  instagramUrl: string;
  // SEO
  seoTitle: string;
  seoDescription: string;
  seoOgImage: string;
  // Footer
  footerText: string;
}

function configFallback(): SiteConfig {
  return {
    name: SITE_CONFIG.name,
    shortName: SITE_CONFIG.shortName,
    tagline: SITE_CONFIG.tagline,
    banglaTagline: SITE_CONFIG.banglaTagline || '',
    email: SITE_CONFIG.email,
    phone: SITE_CONFIG.phone,
    address: SITE_CONFIG.address,
    supportHours: (SITE_CONFIG as any).supportHours || '',
    heroTitle: 'Master Mathematics for School, Olympiad & Admission Success',
    heroSubtitle: 'Mathemzi Edu helps Bangladeshi students build strong mathematical foundations through structured courses, practice exams, books, progress tracking, and expert-guided learning.',
    heroBtn1Text: 'Explore Courses',
    heroBtn1Link: '/courses',
    heroBtn2Text: 'Start Practice Exam',
    heroBtn2Link: '/exams',
    heroBtn3Text: 'Browse Books',
    heroBtn3Link: '/books',
    trustSectionTitle: 'Why Learn With Mathemzi Edu',
    trustSectionItems: ['Structured learning paths for all levels', 'Practice-based exam preparation', 'Manual bKash verified enrollment', 'Progress tracking & completion certificates', 'Admin-managed content & quality control'],
    bkashNumber: BKASH_MANUAL.number,
    bkashAccountType: BKASH_MANUAL.accountType,
    bkashInstructions: BKASH_MANUAL.instructions,
    paymentNote: BKASH_MANUAL.note,
    facebookUrl: SOCIAL_LINKS.facebook,
    youtubeUrl: SOCIAL_LINKS.youtube,
    instagramUrl: SOCIAL_LINKS.instagram,
    seoTitle: 'Mathemzi Edu | Premium Mathematics Learning Platform in Bangladesh',
    seoDescription: 'Master Mathematics for School, Olympiad & Admission Success.',
    seoOgImage: `${SITE_CONFIG.url}/og.png`,
    footerText: 'Master Mathematics with Logic, Practice & Confidence.',
  };
}

let cachedSettings: SiteConfig | null = null;
let cacheTime = 0;
const CACHE_DURATION = 30000;

export function useSiteSettings(): SiteConfig {
  const [settings, setSettings] = useState<SiteConfig>(cachedSettings || configFallback());

  useEffect(() => {
    // Return cached if fresh
    if (cachedSettings && Date.now() - cacheTime < CACHE_DURATION) {
      setSettings(cachedSettings);
      return;
    }

    let cancelled = false;
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'siteSettings', 'main'));
        if (snap.exists() && !cancelled) {
          const data = snap.data() as SiteSettings;
          const merged: SiteConfig = {
            name: data.siteName || configFallback().name,
            shortName: data.shortName || configFallback().shortName,
            tagline: data.tagline || configFallback().tagline,
            banglaTagline: data.banglaTagline || configFallback().banglaTagline,
            email: data.contactEmail || configFallback().email,
            phone: data.contactPhone || configFallback().phone,
            address: data.contactAddress || configFallback().address,
            supportHours: data.supportHours || configFallback().supportHours,
            heroTitle: data.heroTitle || configFallback().heroTitle,
            heroSubtitle: data.heroSubtitle || configFallback().heroSubtitle,
            heroBtn1Text: data.heroBtn1Text || configFallback().heroBtn1Text,
            heroBtn1Link: data.heroBtn1Link || configFallback().heroBtn1Link,
            heroBtn2Text: data.heroBtn2Text || configFallback().heroBtn2Text,
            heroBtn2Link: data.heroBtn2Link || configFallback().heroBtn2Link,
            heroBtn3Text: data.heroBtn3Text || configFallback().heroBtn3Text,
            heroBtn3Link: data.heroBtn3Link || configFallback().heroBtn3Link,
            trustSectionTitle: data.trustSectionTitle || configFallback().trustSectionTitle,
            trustSectionItems: data.trustSectionItems || configFallback().trustSectionItems,
            bkashNumber: data.bkashNumber || configFallback().bkashNumber,
            bkashAccountType: data.bkashAccountType || configFallback().bkashAccountType,
            bkashInstructions: data.bkashInstructions || configFallback().bkashInstructions,
            paymentNote: data.paymentNote || configFallback().paymentNote,
            facebookUrl: data.facebookUrl || configFallback().facebookUrl,
            youtubeUrl: data.youtubeUrl || configFallback().youtubeUrl,
            instagramUrl: data.instagramUrl || configFallback().instagramUrl,
            seoTitle: data.seoTitle || configFallback().seoTitle,
            seoDescription: data.seoDescription || configFallback().seoDescription,
            seoOgImage: data.seoOgImage || configFallback().seoOgImage,
            footerText: data.footerText || configFallback().footerText,
          };
          cachedSettings = merged;
          cacheTime = Date.now();
          setSettings(merged);
        }
      } catch (e) {
        // Firestore unavailable — use config fallback already set
      }
    };

    // In demo mode, check localStorage
    if (DEMO_MODE) {
      try {
        const raw = localStorage.getItem('demo_siteSettings');
        if (raw) {
          const items = JSON.parse(raw) as any[];
          const main = items.find((i: any) => i.id === 'main');
          if (main && !cancelled) {
            const data = main as SiteSettings;
            const merged: SiteConfig = {
              ...configFallback(),
              name: data.siteName || configFallback().name,
              tagline: data.tagline || configFallback().tagline,
              email: data.contactEmail || configFallback().email,
              phone: data.contactPhone || configFallback().phone,
              address: data.contactAddress || configFallback().address,
              bkashNumber: data.bkashNumber || configFallback().bkashNumber,
              bkashInstructions: data.bkashInstructions || configFallback().bkashInstructions,
              facebookUrl: data.facebookUrl || configFallback().facebookUrl,
              youtubeUrl: data.youtubeUrl || configFallback().youtubeUrl,
              footerText: data.footerText || configFallback().footerText,
            };
            setSettings(merged);
            return;
          }
        }
      } catch {}
      // Also try direct Firestore for demo
      fetch();
      return () => { cancelled = true; };
    }

    fetch();
    return () => { cancelled = true; };
  }, []);

  return settings;
}
