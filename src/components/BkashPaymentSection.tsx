import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Smartphone, Copy, CheckCircle, AlertCircle, Loader2, Send, ExternalLink, Eye } from 'lucide-react';
import { BKASH_MANUAL } from '../lib/config';
import { useSiteSettings } from '../lib/useSiteConfig';
import { DEMO_MODE, addDemoLocalData, isPermissionError } from '../lib/demo';
import type { Order } from '../lib/types';

interface BkashPaymentSectionProps {
  order: Order;
  userId: string;
  userEmail: string;
  onSubmitted?: () => void;
}

export default function BkashPaymentSection({ order, userId, userEmail, onSubmitted }: BkashPaymentSectionProps) {
  const cfg = useSiteSettings();
  const bkashNumber = cfg.bkashNumber;
  const bkashAccountType = cfg.bkashAccountType;
  const bkashInstructions = cfg.bkashInstructions;
  const bkashNote = cfg.paymentNote;
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderNumber.trim() || !transactionId.trim()) {
      setError('Please fill in your bKash number and transaction ID.');
      return;
    }
    if (transactionId.trim().length < 5) {
      setError('Please enter a valid transaction ID.');
      return;
    }

    if (!confirm('Submit this transaction for manual verification?')) return;

    setSubmitting(true);
    setError('');

    try {
      const submissionData = {
        orderId: order.id,
        userId,
        userEmail,
        amount: order.amount,
        senderBkashNumber: senderNumber.trim(),
        transactionId: transactionId.trim(),
        paymentNote: paymentNote.trim(),
        status: 'submitted' as const,
        submittedAt: Date.now(),
      };
      await addDoc(collection(db, 'paymentSubmissions'), submissionData);
      setSubmitted(true);
      onSubmitted?.();
    } catch (err) {
      console.error('Submission error:', err);
      // Demo fallback: save to localStorage if Firestore write fails
      if (DEMO_MODE && isPermissionError(err)) {
        addDemoLocalData('paymentSubmissions', {
          orderId: order.id,
          userId,
          userEmail,
          amount: order.amount,
          senderBkashNumber: senderNumber.trim(),
          transactionId: transactionId.trim(),
          status: 'submitted',
          submittedAt: Date.now(),
        } as any);
        setSubmitted(true);
        onSubmitted?.();
        return;
      }
      setError('Failed to submit. Please try again or email us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-[#10B981]/20 bg-[#10B981]/10 p-5 text-center">
        <CheckCircle className="h-8 w-8 text-[#10B981] mx-auto mb-3" />
        <h4 className="text-white font-bold mb-1">Transaction Submitted!</h4>
        <p className="text-sm text-slate-400">Your payment details have been received. Our admin team will verify them within 24 hours and activate your access.</p>
        {DEMO_MODE && (
          <p className="text-[10px] text-purple-400 mt-2 flex items-center justify-center gap-1">
            <Eye className="h-3 w-3" /> Demo mode: saved locally only.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="border border-[#E2136E]/20 bg-gradient-to-br from-[#E2136E]/5 to-[#1A1A2E]/50 rounded-2xl p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-[#E2136E]/20 flex items-center justify-center">
          <Smartphone className="h-5 w-5 text-[#E2136E]" />
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">Pay with bKash (Manual)</h3>
          <p className="text-xs text-slate-400">SSLCommerz automatic payment coming later</p>
        </div>
      </div>

      {/* bKash Number + Amount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div className="bg-black/30 rounded-xl p-4 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">bKash Number</div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-white font-mono">{bkashNumber}</span>
            <button onClick={() => navigator.clipboard.writeText(bkashNumber)}
              className="text-[#E2136E] hover:text-[#E2136E]/80 p-1" title="Copy number">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{bkashAccountType}</div>
        </div>
        <div className="bg-black/30 rounded-xl p-4 border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Payable Amount</div>
          <div className="text-lg font-bold text-[#E2136E]">৳{order.amount.toLocaleString('en-BD')}</div>
          <div className="text-[10px] text-slate-500 mt-1">Order: {order.id?.slice(-8) || 'N/A'}</div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-5">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">How to Pay</h4>
        <ol className="space-y-1.5">
          {bkashInstructions.map((step, i) => (
            <li key={i} className="flex gap-2 text-xs text-slate-400">
              <span className="text-[#E2136E] font-bold shrink-0 w-4">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-[10px] text-slate-500 mb-5 bg-white/5 p-3 rounded-lg border border-white/5">
        <AlertCircle className="h-3 w-3 inline mr-1 text-[#F59E0B]" />
        {bkashNote}
      </p>

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Your bKash Number *</label>
          <input required value={senderNumber} onChange={e => setSenderNumber(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-[#E2136E] focus:ring-1 focus:ring-[#E2136E] placeholder:text-slate-600" />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">bKash Transaction ID (TrxID) *</label>
          <input required value={transactionId} onChange={e => setTransactionId(e.target.value)}
            placeholder="e.g. TR123456ABCD"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-[#E2136E] focus:ring-1 focus:ring-[#E2136E] placeholder:text-slate-600 font-mono" />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Note (optional)</label>
          <input value={paymentNote} onChange={e => setPaymentNote(e.target.value)}
            placeholder="Any reference or note"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-[#E2136E] focus:ring-1 focus:ring-[#E2136E] placeholder:text-slate-600" />
        </div>

        {error && (
          <div className="rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        <button type="submit" disabled={submitting}
          className="w-full bg-[#E2136E] hover:bg-[#c0105a] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#E2136E]/20 flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <><Send className="h-4 w-4" /> Submit Transaction ID</>}
        </button>
      </form>
    </div>
  );
}
