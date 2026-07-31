import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { DEMO_MODE } from './demo';
import { DEFAULT_SITE_SETTINGS } from './siteSettings';
import type { SiteSettings } from './types';

export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  banglaTagline: string;
  logoUrl: string;
  faviconUrl: string;
  email: string;
  phone: string;
  address: string;
  supportHours: string;
  heroBadge: string;
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
  aboutTitle: string;
  aboutIntro: string;
  missionTitle: string;
  missionText: string;
  visionTitle: string;
  visionText: string;
  aboutFeatures: string[];
  contactPageTitle: string;
  contactPageSubtitle: string;
  bkashNumber: string;
  bkashAccountType: string;
  bkashInstructions: string[];
  paymentSupportContact: string;
  paymentNote: string;
  facebookUrl: string;
  youtubeUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  seoOgImage: string;
  privacyIntro: string;
  privacyDataText: string;
  privacySecurityText: string;
  termsIntro: string;
  termsAccessText: string;
  termsPaymentsText: string;
  footerText: string;
}

function toSiteConfig(data?: Partial<SiteSettings>): SiteConfig {
  const value = { ...DEFAULT_SITE_SETTINGS, ...data };
  return {
    name: value.siteName,
    shortName: value.shortName,
    tagline: value.tagline,
    banglaTagline: value.banglaTagline,
    logoUrl: value.logoUrl,
    faviconUrl: value.faviconUrl,
    email: value.contactEmail,
    phone: value.contactPhone,
    address: value.contactAddress,
    supportHours: value.supportHours,
    heroBadge: value.heroBadge,
    heroTitle: value.heroTitle,
    heroSubtitle: value.heroSubtitle,
    heroBtn1Text: value.heroBtn1Text,
    heroBtn1Link: value.heroBtn1Link,
    heroBtn2Text: value.heroBtn2Text,
    heroBtn2Link: value.heroBtn2Link,
    heroBtn3Text: value.heroBtn3Text,
    heroBtn3Link: value.heroBtn3Link,
    trustSectionTitle: value.trustSectionTitle,
    trustSectionItems: value.trustSectionItems,
    aboutTitle: value.aboutTitle,
    aboutIntro: value.aboutIntro,
    missionTitle: value.missionTitle,
    missionText: value.missionText,
    visionTitle: value.visionTitle,
    visionText: value.visionText,
    aboutFeatures: value.aboutFeatures,
    contactPageTitle: value.contactPageTitle,
    contactPageSubtitle: value.contactPageSubtitle,
    bkashNumber: value.bkashNumber,
    bkashAccountType: value.bkashAccountType,
    bkashInstructions: value.bkashInstructions,
    paymentSupportContact: value.paymentSupportContact,
    paymentNote: value.paymentNote,
    facebookUrl: value.facebookUrl,
    youtubeUrl: value.youtubeUrl,
    instagramUrl: value.instagramUrl,
    linkedinUrl: value.linkedinUrl,
    twitterUrl: value.twitterUrl,
    seoTitle: value.seoTitle,
    seoDescription: value.seoDescription,
    seoKeywords: value.seoKeywords,
    seoOgImage: value.seoOgImage,
    privacyIntro: value.privacyIntro,
    privacyDataText: value.privacyDataText,
    privacySecurityText: value.privacySecurityText,
    termsIntro: value.termsIntro,
    termsAccessText: value.termsAccessText,
    termsPaymentsText: value.termsPaymentsText,
    footerText: value.footerText,
  };
}

let cachedSettings: SiteConfig | null = null;
let cacheTime = 0;
const CACHE_DURATION = 30000;

export function invalidateSiteSettingsCache() {
  cachedSettings = null;
  cacheTime = 0;
}

export function useSiteSettings(): SiteConfig {
  const [settings, setSettings] = useState<SiteConfig>(cachedSettings || toSiteConfig());

  useEffect(() => {
    if (cachedSettings && Date.now() - cacheTime < CACHE_DURATION) {
      setSettings(cachedSettings);
      return;
    }

    let cancelled = false;
    const apply = (data?: Partial<SiteSettings>) => {
      if (cancelled) return;
      const merged = toSiteConfig(data);
      cachedSettings = merged;
      cacheTime = Date.now();
      setSettings(merged);
    };

    const fetchSettings = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'siteSettings', 'main'));
        apply(snapshot.exists() ? snapshot.data() as SiteSettings : undefined);
      } catch {
        apply();
      }
    };

    if (DEMO_MODE) {
      try {
        const raw = localStorage.getItem('demo_siteSettings');
        if (raw) {
          const items = JSON.parse(raw) as SiteSettings[];
          const main = items.find(item => item.id === 'main');
          if (main) {
            apply(main);
            return () => { cancelled = true; };
          }
        }
      } catch {
        // Ignore invalid local demo data and use Firestore/default settings.
      }
    }

    fetchSettings();
    return () => { cancelled = true; };
  }, []);

  return settings;
}
