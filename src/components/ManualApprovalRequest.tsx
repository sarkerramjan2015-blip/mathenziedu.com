import React, { useEffect, useState } from 'react';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { AlertCircle, CheckCircle, Loader2, MessageSquare, Send, ShieldCheck } from 'lucide-react';
import { db } from '../lib/firebase';
import { DEMO_MODE, addDemoLocalData, getDemoLocalData, isPermissionError } from '../lib/demo';
import { formatCurrency } from '../lib/media';
import type { Order, PaymentSubmission } from '../lib/types';

interface ManualApprovalRequestProps {
  order: Order;
  userId: string;
  userEmail: string;
  onSubmitted?: () => void;
}

export default function ManualApprovalRequest({ order, userId, userEmail, onSubmitted }: ManualApprovalRequestProps) {
  const [message, setMessage] = useState('');
  const [request, setRequest] = useState<PaymentSubmission | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadRequest = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, 'paymentSubmissions'), where('userId', '==', userId)));
        const latest = snapshot.docs
          .map(item => ({ id: item.id, ...item.data() }) as PaymentSubmission)
          .filter(item => item.orderId === order.id)
          .sort((a, b) => b.submittedAt - a.submittedAt)[0];
        if (active) setRequest(latest || null);
      } catch (loadError) {
        if (DEMO_MODE && isPermissionError(loadError)) {
          const latest = (getDemoLocalData('paymentSubmissions') as PaymentSubmission[])
            .filter(item => item.userId === userId && item.orderId === order.id)
            .sort((a, b) => b.submittedAt - a.submittedAt)[0];
          if (active) setRequest(latest || null);
        }
      } finally {
        if (active) setLoadingRequest(false);
      }
    };

    void loadRequest();
    return () => { active = false; };
  }, [order.id, userId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 4) {
      setError('Please write a short payment confirmation message for the admin.');
      return;
    }

    setSubmitting(true);
    setError('');

    const requestData: Omit<PaymentSubmission, 'id'> = {
      orderId: order.id || '',
      userId,
      userEmail,
      amount: order.amount,
      // Kept for compatibility with existing published Firestore rules and old requests.
      senderBkashNumber: '',
      transactionId: '',
      paymentNote: trimmedMessage,
      status: 'submitted',
      submittedAt: Date.now(),
    };

    try {
      await addDoc(collection(db, 'paymentSubmissions'), requestData);
      setRequest(requestData);
      onSubmitted?.();
    } catch (submitError) {
      if (DEMO_MODE && isPermissionError(submitError)) {
        const savedRequest = addDemoLocalData('paymentSubmissions', requestData) as PaymentSubmission;
        setRequest(savedRequest);
        onSubmitted?.();
      } else {
        setError('Could not send your request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const itemLabel = order.itemType === 'course' ? 'course access' : 'order approval';

  if (loadingRequest) {
    return <div className="flex items-center justify-center py-5 text-xs text-slate-400"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking request status...</div>;
  }

  if (request?.status === 'submitted') {
    return (
      <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-5 text-center">
        <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-amber-300" />
        <h4 className="mb-1 font-bold text-white">Approval Request Sent</h4>
        <p className="text-sm text-slate-300">Your message is in the admin approval queue. Access will be activated after approval.</p>
      </div>
    );
  }

  if (request?.status === 'verified') {
    return (
      <div className="rounded-xl border border-[#10B981]/20 bg-[#10B981]/10 p-5 text-center">
        <CheckCircle className="mx-auto mb-3 h-8 w-8 text-[#10B981]" />
        <h4 className="mb-1 font-bold text-white">Access Approved</h4>
        <p className="text-sm text-slate-300">Your approval is complete. Reload this page to open your content.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-400/20 bg-blue-500/5 p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
          <MessageSquare className="h-5 w-5 text-blue-300" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Request {itemLabel}</h3>
          <p className="text-xs text-slate-400">Send your payment confirmation directly to the admin queue.</p>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-white/5 bg-black/20 p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Payable amount</div>
        <div className="mt-1 text-lg font-bold text-white">{formatCurrency(order.amount)}</div>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">Complete payment using the method agreed with Mathenzi Edu, then send a short confirmation message. The admin will review it and unlock access.</p>
      </div>

      {request?.status === 'rejected' && (
        <div className="mb-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          <strong className="block text-red-300">Admin requested an update</strong>
          {request.adminNote || 'Please send a new message with the correct payment details.'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Message for admin</label>
          <textarea
            required
            rows={4}
            maxLength={500}
            value={message}
            onChange={event => setMessage(event.target.value)}
            placeholder="I have completed the payment. Please approve my course access."
            className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 placeholder:text-slate-600"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-3 font-bold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Send className="h-4 w-4" /> Send for Admin Approval</>}
        </button>
      </form>
    </div>
  );
}
