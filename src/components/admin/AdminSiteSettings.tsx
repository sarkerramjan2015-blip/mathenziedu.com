import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  Home,
  Loader2,
  Palette,
  Phone,
  Save,
  Search,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { DEMO_MODE, addDemoLocalData, isPermissionError } from '../../lib/demo';
import { DEFAULT_SITE_SETTINGS } from '../../lib/siteSettings';
import { invalidateSiteSettingsCache } from '../../lib/useSiteConfig';
import type { SiteSettings } from '../../lib/types';

type SettingsSection = 'branding' | 'homepage' | 'about' | 'contact' | 'social' | 'seo' | 'policies';

const sections: Array<{
  id: SettingsSection;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  { id: 'branding', label: 'নাম ও লোগো', description: 'সাইটের পরিচয়', icon: Palette },
  { id: 'homepage', label: 'হোমপেজ', description: 'প্রথম পাতার লেখা ও বাটন', icon: Home },
  { id: 'about', label: 'আমাদের সম্পর্কে', description: 'মিশন, ভিশন ও ফিচার', icon: Users },
  { id: 'contact', label: 'যোগাযোগ', description: 'ফোন, ইমেইল ও ঠিকানা', icon: Phone },
  { id: 'social', label: 'সোশ্যাল লিংক', description: 'Facebook, YouTube ইত্যাদি', icon: Share2 },
  { id: 'seo', label: 'Google ও শেয়ার', description: 'Search এবং social preview', icon: Search },
  { id: 'policies', label: 'নীতিমালা', description: 'Privacy ও Terms', icon: FileText },
];

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'tel' | 'url';
}

function TextField({ label, value, onChange, helper, placeholder, required, type = 'text' }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-white">
        {label}{required && <span className="ml-1 text-rose-400">*</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-[#0B1220] px-4 py-3 text-sm text-white outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 placeholder:text-slate-600"
      />
      {helper && <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">{helper}</span>}
    </label>
  );
}

function TextAreaField({ label, value, onChange, helper, placeholder, required, rows = 4 }: FieldProps & { rows?: number }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-white">
        {label}{required && <span className="ml-1 text-rose-400">*</span>}
      </span>
      <textarea
        required={required}
        rows={rows}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-white/10 bg-[#0B1220] px-4 py-3 text-sm leading-relaxed text-white outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 placeholder:text-slate-600"
      />
      {helper && <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">{helper}</span>}
    </label>
  );
}

export default function AdminSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(DEFAULT_SITE_SETTINGS));
  const [section, setSection] = useState<SettingsSection>('branding');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isDirty = useMemo(() => JSON.stringify(settings) !== savedSnapshot, [settings, savedSnapshot]);
  const currentSection = sections.find(item => item.id === section) || sections[0];

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'siteSettings', 'main'));
        const value = snapshot.exists()
          ? { ...DEFAULT_SITE_SETTINGS, ...snapshot.data() } as SiteSettings
          : DEFAULT_SITE_SETTINGS;
        if (active) {
          setSettings(value);
          setSavedSnapshot(JSON.stringify(value));
        }
      } catch {
        if (active) {
          setMessage({ type: 'error', text: 'সেভ করা সেটিংস পাওয়া যায়নি। এখন ডিফল্ট তথ্য দেখানো হচ্ছে।' });
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const warnBeforeLeave = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warnBeforeLeave);
    return () => window.removeEventListener('beforeunload', warnBeforeLeave);
  }, [isDirty]);

  const update = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings(previous => ({ ...previous, [key]: value }));
    setMessage(null);
  };

  const validate = () => {
    if (!settings.siteName.trim() || !settings.heroTitle.trim()) {
      return 'সাইটের নাম এবং হোমপেজের প্রধান শিরোনাম অবশ্যই দিতে হবে।';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contactEmail.trim())) {
      return 'যোগাযোগের ইমেইলটি সঠিকভাবে লিখুন।';
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    setSaving(true);
    setMessage(null);
    const value = { ...settings, updatedAt: Date.now() };
    try {
      try {
        await setDoc(doc(db, 'siteSettings', 'main'), value);
      } catch (error) {
        if (DEMO_MODE && isPermissionError(error)) {
          addDemoLocalData('siteSettings', { id: 'main', ...value });
        } else {
          throw error;
        }
      }
      setSettings(value);
      setSavedSnapshot(JSON.stringify(value));
      invalidateSiteSettingsCache();
      setMessage({ type: 'success', text: 'পরিবর্তনগুলো সফলভাবে সেভ হয়েছে। “ওয়েবসাইট দেখুন” চাপলে নতুন তথ্য দেখতে পাবেন।' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'সেভ করা যায়নি। ইন্টারনেট সংযোগ ও আপনার Admin অনুমতি পরীক্ষা করুন।' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
        <Loader2 className="h-7 w-7 animate-spin text-[#2563EB]" />
        <span className="ml-3 text-sm text-slate-300">সাইটের তথ্য লোড হচ্ছে…</span>
      </div>
    );
  }

  const sectionIndex = sections.findIndex(item => item.id === section);
  const nextSection = sections[sectionIndex + 1];

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#172554]/60 to-[#0F172A] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-300">
              <Sparkles className="h-4 w-4" /> Website Editor
            </div>
            <h2 className="text-2xl font-extrabold text-white">ওয়েবসাইটের লেখা ও তথ্য পরিবর্তন করুন</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
              বাম পাশ থেকে একটি অংশ বেছে নিন, প্রয়োজনীয় তথ্য লিখুন, তারপর একবার “সব পরিবর্তন সেভ করুন” চাপুন।
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4" /> ওয়েবসাইট দেখুন
            </a>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'সেভ হচ্ছে…' : isDirty ? 'সব পরিবর্তন সেভ করুন' : 'সব সেভ করা আছে'}
            </button>
          </div>
        </div>

        {isDirty && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            আপনি কিছু তথ্য পরিবর্তন করেছেন—পেজ ছাড়ার আগে সেভ করুন।
          </div>
        )}
        {message && (
          <div
            role="status"
            className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
              message.type === 'success'
                ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                : 'border-rose-400/20 bg-rose-400/10 text-rose-200'
            }`}
          >
            {message.type === 'success' ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            {message.text}
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
        <nav aria-label="Website settings sections" className="h-fit rounded-2xl border border-white/10 bg-white/5 p-2">
          {sections.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                section === item.id
                  ? 'bg-[#2563EB] text-white shadow-lg'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${section === item.id ? 'bg-white/15' : 'bg-white/5'}`}>
                <item.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">{item.label}</span>
                <span className={`block truncate text-[11px] ${section === item.id ? 'text-blue-100' : 'text-slate-500'}`}>{item.description}</span>
              </span>
            </button>
          ))}
        </nav>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7">
          <div className="mb-7 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2563EB]/15 text-blue-300">
                <currentSection.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-xl font-extrabold text-white">{currentSection.label}</h3>
                <p className="text-sm text-slate-400">{currentSection.description}</p>
              </div>
            </div>
          </div>

          {section === 'branding' && (
            <div className="grid gap-5 md:grid-cols-2">
              <TextField label="ওয়েবসাইটের পূর্ণ নাম" value={settings.siteName} onChange={value => update('siteName', value)} required helper="Navbar, footer এবং page title-এ ব্যবহৃত হবে।" />
              <TextField label="ছোট নাম" value={settings.shortName} onChange={value => update('shortName', value)} required helper="কম জায়গায় দেখানোর জন্য সংক্ষিপ্ত নাম।" />
              <TextField label="English tagline" value={settings.tagline} onChange={value => update('tagline', value)} />
              <TextField label="বাংলা tagline" value={settings.banglaTagline} onChange={value => update('banglaTagline', value)} />
              <TextField label="Logo image link" value={settings.logoUrl} onChange={value => update('logoUrl', value)} placeholder="https://…" helper="খালি রাখলে বর্তমান বইয়ের icon দেখাবে।" />
              <TextField label="Browser icon link" value={settings.faviconUrl} onChange={value => update('faviconUrl', value)} placeholder="https://…" helper="Browser tab-এর ছোট icon।" />
            </div>
          )}

          {section === 'homepage' && (
            <div className="space-y-6">
              <TextField label="উপরের ছোট পরিচিতি" value={settings.heroBadge} onChange={value => update('heroBadge', value)} helper="যেমন: Bangladesh's Premium Math Platform" />
              <TextField label="প্রধান শিরোনাম" value={settings.heroTitle} onChange={value => update('heroTitle', value)} required />
              <TextAreaField label="শিরোনামের নিচের লেখা" value={settings.heroSubtitle} onChange={value => update('heroSubtitle', value)} required rows={4} />
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <h4 className="mb-4 font-bold text-white">হোমপেজের তিনটি বাটন</h4>
                <div className="grid gap-5 md:grid-cols-2">
                  <TextField label="বাটন ১-এর লেখা" value={settings.heroBtn1Text} onChange={value => update('heroBtn1Text', value)} />
                  <TextField label="বাটন ১ কোথায় যাবে" value={settings.heroBtn1Link} onChange={value => update('heroBtn1Link', value)} helper="যেমন: /courses" />
                  <TextField label="বাটন ২-এর লেখা" value={settings.heroBtn2Text} onChange={value => update('heroBtn2Text', value)} />
                  <TextField label="বাটন ২ কোথায় যাবে" value={settings.heroBtn2Link} onChange={value => update('heroBtn2Link', value)} helper="যেমন: /exams" />
                  <TextField label="বাটন ৩-এর লেখা" value={settings.heroBtn3Text} onChange={value => update('heroBtn3Text', value)} />
                  <TextField label="বাটন ৩ কোথায় যাবে" value={settings.heroBtn3Link} onChange={value => update('heroBtn3Link', value)} helper="যেমন: /books" />
                </div>
              </div>
              <TextField label="কেন আমাদের সাথে শিখবে—শিরোনাম" value={settings.trustSectionTitle} onChange={value => update('trustSectionTitle', value)} />
              <TextAreaField
                label="বিশ্বাসযোগ্যতার পয়েন্টগুলো"
                value={settings.trustSectionItems.join('\n')}
                onChange={value => update('trustSectionItems', value.split('\n').map(item => item.trim()).filter(Boolean))}
                helper="প্রতিটি পয়েন্ট নতুন লাইনে লিখুন।"
                rows={6}
              />
            </div>
          )}

          {section === 'about' && (
            <div className="space-y-5">
              <TextField label="Page title" value={settings.aboutTitle} onChange={value => update('aboutTitle', value)} required />
              <TextAreaField label="শুরুর পরিচিতি" value={settings.aboutIntro} onChange={value => update('aboutIntro', value)} required />
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-4 rounded-2xl border border-blue-400/15 bg-blue-400/5 p-4">
                  <TextField label="Mission শিরোনাম" value={settings.missionTitle} onChange={value => update('missionTitle', value)} />
                  <TextAreaField label="Mission-এর লেখা" value={settings.missionText} onChange={value => update('missionText', value)} rows={6} />
                </div>
                <div className="space-y-4 rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
                  <TextField label="Vision শিরোনাম" value={settings.visionTitle} onChange={value => update('visionTitle', value)} />
                  <TextAreaField label="Vision-এর লেখা" value={settings.visionText} onChange={value => update('visionText', value)} rows={6} />
                </div>
              </div>
              <TextAreaField
                label="গুরুত্বপূর্ণ ফিচারগুলো"
                value={settings.aboutFeatures.join('\n')}
                onChange={value => update('aboutFeatures', value.split('\n').map(item => item.trim()).filter(Boolean))}
                helper="প্রতিটি ফিচার নতুন লাইনে লিখুন।"
                rows={7}
              />
            </div>
          )}

          {section === 'contact' && (
            <div className="space-y-5">
              <TextField label="Contact page-এর শিরোনাম" value={settings.contactPageTitle} onChange={value => update('contactPageTitle', value)} />
              <TextAreaField label="Contact page-এর পরিচিতি" value={settings.contactPageSubtitle} onChange={value => update('contactPageSubtitle', value)} />
              <div className="grid gap-5 md:grid-cols-2">
                <TextField label="ফোন নম্বর" type="tel" value={settings.contactPhone} onChange={value => update('contactPhone', value)} required />
                <TextField label="Support email" type="email" value={settings.contactEmail} onChange={value => update('contactEmail', value)} required />
                <TextField label="অফিস/যোগাযোগের ঠিকানা" value={settings.contactAddress} onChange={value => update('contactAddress', value)} />
                <TextField label="Support সময়" value={settings.supportHours} onChange={value => update('supportHours', value)} />
              </div>
            </div>
          )}

          {section === 'social' && (
            <div className="grid gap-5 md:grid-cols-2">
              <TextField label="Facebook page link" value={settings.facebookUrl} onChange={value => update('facebookUrl', value)} placeholder="https://facebook.com/…" />
              <TextField label="YouTube channel link" value={settings.youtubeUrl} onChange={value => update('youtubeUrl', value)} placeholder="https://youtube.com/…" />
              <TextField label="Instagram link" value={settings.instagramUrl} onChange={value => update('instagramUrl', value)} placeholder="https://instagram.com/…" />
              <TextField label="X / Twitter link" value={settings.twitterUrl} onChange={value => update('twitterUrl', value)} placeholder="https://x.com/…" />
              <TextField label="LinkedIn link" value={settings.linkedinUrl} onChange={value => update('linkedinUrl', value)} placeholder="Optional" />
            </div>
          )}

          {section === 'seo' && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-xl border border-blue-400/15 bg-blue-400/5 px-4 py-3 text-sm text-blue-100">
                <Globe className="mt-0.5 h-4 w-4 shrink-0" />
                এগুলো Google search এবং Facebook/WhatsApp-এ link share করলে ব্যবহার হবে।
              </div>
              <TextField label="Google-এ দেখানো title" value={settings.seoTitle} onChange={value => update('seoTitle', value)} />
              <TextAreaField label="Google-এ দেখানো description" value={settings.seoDescription} onChange={value => update('seoDescription', value)} rows={4} />
              <TextField label="Search keywords" value={settings.seoKeywords} onChange={value => update('seoKeywords', value)} helper="Comma দিয়ে আলাদা করুন।" />
              <TextField label="Social share image link" value={settings.seoOgImage} onChange={value => update('seoOgImage', value)} />
              <TextAreaField label="Footer-এর পরিচিতি" value={settings.footerText} onChange={value => update('footerText', value)} rows={4} />
            </div>
          )}

          {section === 'policies' && (
            <div className="space-y-7">
              <div className="space-y-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-5">
                <h4 className="font-extrabold text-white">Privacy Policy</h4>
                <TextAreaField label="শুরুর কথা" value={settings.privacyIntro} onChange={value => update('privacyIntro', value)} />
                <TextAreaField label="কোন তথ্য ব্যবহার হয়" value={settings.privacyDataText} onChange={value => update('privacyDataText', value)} />
                <TextAreaField label="তথ্যের নিরাপত্তা" value={settings.privacySecurityText} onChange={value => update('privacySecurityText', value)} />
              </div>
              <div className="space-y-4 rounded-2xl border border-purple-400/15 bg-purple-400/5 p-5">
                <h4 className="font-extrabold text-white">Terms of Service</h4>
                <TextAreaField label="শুরুর কথা" value={settings.termsIntro} onChange={value => update('termsIntro', value)} />
                <TextAreaField label="Course access-এর নিয়ম" value={settings.termsAccessText} onChange={value => update('termsAccessText', value)} />
                <TextAreaField label="Payment ও exam-এর নিয়ম" value={settings.termsPaymentsText} onChange={value => update('termsPaymentsText', value)} />
              </div>
            </div>
          )}

          {nextSection && (
            <div className="mt-8 flex justify-end border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() => setSection(nextSection.id)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/10"
              >
                পরের অংশ: {nextSection.label} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
