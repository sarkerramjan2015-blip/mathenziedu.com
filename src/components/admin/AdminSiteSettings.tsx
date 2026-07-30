import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Save, Loader2, CheckCircle, Eye, Globe, Palette, Phone, CreditCard, Share2, Search, Home, Settings as SettingsIcon } from 'lucide-react';
import { L } from '../../lib/i18n';
import { DEMO_MODE, addDemoLocalData, isPermissionError } from '../../lib/demo';
import type { SiteSettings } from '../../lib/types';

const defaultSettings: SiteSettings = {
  siteName: 'Mathemzi Edu',
  shortName: 'Mathemzi',
  tagline: 'Master Mathematics with Logic, Practice & Confidence',
  banglaTagline: 'গণিত হোক সহজ, যুক্তিতে হোক শক্তিশালী',
  logoUrl: '',
  faviconUrl: '',
  heroTitle: 'Master Mathematics for School, Olympiad & Admission Success',
  heroSubtitle: 'Mathemzi Edu helps Bangladeshi students build strong mathematical foundations through structured courses, practice exams, books, progress tracking, and expert-guided learning.',
  heroBtn1Text: 'Explore Courses',
  heroBtn1Link: '/courses',
  heroBtn2Text: 'Start Practice Exam',
  heroBtn2Link: '/exams',
  heroBtn3Text: 'Browse Books',
  heroBtn3Link: '/books',
  trustSectionTitle: 'Why Learn With Mathemzi Edu',
  trustSectionItems: [
    'Structured learning paths for all levels',
    'Practice-based exam preparation',
    'Manual bKash verified enrollment',
    'Progress tracking & completion certificates',
    'Admin-managed content & quality control',
  ],
  contactPhone: '+880 1700 000000',
  contactEmail: 'support@mathemziedu.com',
  contactAddress: 'Dhaka, Bangladesh',
  supportHours: 'Saturday – Thursday, 10:00 AM – 8:00 PM (BST)',
  bkashNumber: '01XXXXXXXXX',
  bkashAccountType: 'Merchant',
  bkashInstructions: [
    'Go to your bKash app and select "Send Money".',
    'Enter our bKash number shown above.',
    'Enter the exact payable amount from your order.',
    'Write your Order ID in the reference field (recommended).',
    'Enter your bKash PIN and confirm the payment.',
    'Copy the Transaction ID (TrxID) from the bKash confirmation message.',
    'Return to this page and submit your Transaction ID and bKash number below.',
  ],
  paymentSupportContact: 'support@mathemziedu.com',
  paymentNote: 'Please send the payable amount to our bKash number. After payment, submit your bKash Transaction ID from your dashboard or payment section. Our admin team will verify the payment manually. Access will be activated after verification.',
  facebookUrl: 'https://facebook.com/mathemziedu',
  youtubeUrl: 'https://youtube.com/@mathemziedu',
  instagramUrl: 'https://instagram.com/mathemziedu',
  linkedinUrl: '',
  twitterUrl: 'https://twitter.com/mathemziedu',
  seoTitle: 'Mathemzi Edu | Premium Mathematics Learning Platform in Bangladesh',
  seoDescription: 'Master Mathematics for School, Olympiad & Admission Success. Bangladesh-focused mathematics learning ecosystem.',
  seoKeywords: 'mathematics learning Bangladesh, math courses, olympiad preparation, admission math',
  seoOgImage: 'https://mathemziedu.com/og.png',
  footerText: 'Master Mathematics with Logic, Practice & Confidence. Your complete Bangladesh-focused learning ecosystem.',
  updatedAt: Date.now(),
};

export default function AdminSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [section, setSection] = useState<'branding' | 'homepage' | 'contact' | 'payment' | 'social' | 'seo'>('branding');

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'siteSettings', 'main'));
        if (snap.exists()) {
          setSettings({ ...defaultSettings, ...snap.data() } as SiteSettings);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const update = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      try {
        await setDoc(doc(db, 'siteSettings', 'main'), { ...settings, updatedAt: Date.now() });
      } catch (e) {
        if (DEMO_MODE && isPermissionError(e)) {
          addDemoLocalData('siteSettings', { id: 'main', ...settings, updatedAt: Date.now() });
        } else { throw e; }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); alert('Save failed'); }
    finally { setSaving(false); }
  };

  const sections = [
    { id: 'branding' as const, icon: Palette, label: L.branding },
    { id: 'homepage' as const, icon: Home, label: L.homepage },
    { id: 'contact' as const, icon: Phone, label: L.contactInfo },
    { id: 'payment' as const, icon: CreditCard, label: L.paymentSettings },
    { id: 'social' as const, icon: Share2, label: L.socialLinks },
    { id: 'seo' as const, icon: Search, label: L.seoSettings },
  ];

  if (loading) return <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" /></div>;

  const TextInput = ({ label, value, field, placeholder = '' }: { label: string; value: string; field: keyof SiteSettings; placeholder?: string }) => (
    <div className="mb-4">
      <label className="block text-xs font-bold text-slate-400 mb-1.5">{label}</label>
      <input value={value} onChange={e => update(field, e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-slate-600" />
    </div>
  );

  const TextArea = ({ label, value, field, rows = 3 }: { label: string; value: string; field: keyof SiteSettings; rows?: number }) => (
    <div className="mb-4">
      <label className="block text-xs font-bold text-slate-400 mb-1.5">{label}</label>
      <textarea value={value} onChange={e => update(field, e.target.value)} rows={rows}
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-slate-600 resize-y" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{L.siteSettings}</h2>
          <p className="text-xs text-slate-400 mt-1">{L.settingsHelp}</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-[#10B981] flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Saved</span>}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {L.save}
          </button>
        </div>
      </div>

      {DEMO_MODE && (
        <div className="rounded-xl bg-purple-500/10 border border-purple-500/30 px-4 py-2.5 text-xs text-purple-300 flex items-center gap-2">
          <Eye className="h-3.5 w-3.5" /> Demo mode: changes are saved locally only.
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              section === s.id ? 'bg-[#2563EB] text-white shadow-lg' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}>
            <s.icon className="h-4 w-4" />
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        {/* Branding */}
        {section === 'branding' && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">{L.branding}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <TextInput label="Site Name / সাইটের নাম" value={settings.siteName} field="siteName" />
              <TextInput label="Short Name / সংক্ষিপ্ত নাম" value={settings.shortName} field="shortName" />
              <TextInput label="English Tagline / ইংরেজি ট্যাগলাইন" value={settings.tagline} field="tagline" />
              <TextInput label="Bangla Tagline / বাংলা ট্যাগলাইন" value={settings.banglaTagline} field="banglaTagline" />
            </div>
            <TextInput label="Logo URL / লোগোর লিংক" value={settings.logoUrl} field="logoUrl" placeholder="https://..." />
            <TextInput label="Favicon URL / ফেভিকন লিংক" value={settings.faviconUrl} field="faviconUrl" placeholder="https://..." />
          </div>
        )}

        {/* Homepage */}
        {section === 'homepage' && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">{L.homepage}</h3>
            <TextInput label="Hero Title / হিরো টাইটেল" value={settings.heroTitle} field="heroTitle" />
            <TextArea label="Hero Subtitle / হিরো সাবটাইটেল" value={settings.heroSubtitle} field="heroSubtitle" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <TextInput label="Button 1 Text / বাটন ১ টেক্সট" value={settings.heroBtn1Text} field="heroBtn1Text" />
              <TextInput label="Button 1 Link / বাটন ১ লিংক" value={settings.heroBtn1Link} field="heroBtn1Link" />
              <TextInput label="Button 2 Text / বাটন ২ টেক্সট" value={settings.heroBtn2Text} field="heroBtn2Text" />
              <TextInput label="Button 2 Link / বাটন ২ লিংক" value={settings.heroBtn2Link} field="heroBtn2Link" />
              <TextInput label="Button 3 Text / বাটন ৩ টেক্সট" value={settings.heroBtn3Text} field="heroBtn3Text" />
              <TextInput label="Button 3 Link / বাটন ৩ লিংক" value={settings.heroBtn3Link} field="heroBtn3Link" />
            </div>
            <TextInput label="Trust Section Title / ট্রাস্ট সেকশন টাইটেল" value={settings.trustSectionTitle} field="trustSectionTitle" />
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Trust Items (one per line) / ট্রাস্ট আইটেম</label>
              <textarea value={settings.trustSectionItems.join('\n')} onChange={e => update('trustSectionItems', e.target.value.split('\n').filter(Boolean))}
                rows={5}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-slate-600 resize-y" />
            </div>
          </div>
        )}

        {/* Contact */}
        {section === 'contact' && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">{L.contactInfo}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <TextInput label="Phone / ফোন" value={settings.contactPhone} field="contactPhone" />
              <TextInput label="Email / ইমেইল" value={settings.contactEmail} field="contactEmail" />
            </div>
            <TextInput label="Address / ঠিকানা" value={settings.contactAddress} field="contactAddress" />
            <TextInput label="Support Hours / সাপোর্ট আওয়ার" value={settings.supportHours} field="supportHours" />
          </div>
        )}

        {/* Payment */}
        {section === 'payment' && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">{L.paymentSettings}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <TextInput label="bKash Number / বিকাশ নাম্বার" value={settings.bkashNumber} field="bkashNumber" />
              <TextInput label="Account Type / একাউন্ট টাইপ" value={settings.bkashAccountType} field="bkashAccountType" />
            </div>
            <TextInput label="Support Contact / সাপোর্ট কন্টাক্ট" value={settings.paymentSupportContact} field="paymentSupportContact" />
            <TextArea label="Payment Note / পেমেন্ট নোট" value={settings.paymentNote} field="paymentNote" />
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 mb-1.5">bKash Instructions (one per line) / বিকাশ নির্দেশনা</label>
              <textarea value={settings.bkashInstructions.join('\n')} onChange={e => update('bkashInstructions', e.target.value.split('\n').filter(Boolean))}
                rows={7}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] placeholder:text-slate-600 resize-y" />
            </div>
          </div>
        )}

        {/* Social */}
        {section === 'social' && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">{L.socialLinks}</h3>
            <TextInput label="Facebook URL" value={settings.facebookUrl} field="facebookUrl" />
            <TextInput label="YouTube URL" value={settings.youtubeUrl} field="youtubeUrl" />
            <TextInput label="Instagram URL" value={settings.instagramUrl} field="instagramUrl" />
            <TextInput label="LinkedIn URL" value={settings.linkedinUrl} field="linkedinUrl" placeholder="Optional / অপশনাল" />
            <TextInput label="Twitter/X URL" value={settings.twitterUrl} field="twitterUrl" />
          </div>
        )}

        {/* SEO */}
        {section === 'seo' && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">{L.seoSettings}</h3>
            <TextInput label="SEO Title / এসইও টাইটেল" value={settings.seoTitle} field="seoTitle" />
            <TextArea label="SEO Description / এসইও ডেসক্রিপশন" value={settings.seoDescription} field="seoDescription" />
            <TextInput label="SEO Keywords / কিওয়ার্ড" value={settings.seoKeywords} field="seoKeywords" />
            <TextInput label="OG Image URL / ওজি ইমেজ" value={settings.seoOgImage} field="seoOgImage" />
            <TextArea label="Footer Text / ফুটার টেক্সট" value={settings.footerText} field="footerText" />
          </div>
        )}
      </div>
    </div>
  );
}
