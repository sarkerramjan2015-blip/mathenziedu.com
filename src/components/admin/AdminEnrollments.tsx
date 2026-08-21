import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, runTransaction, updateDoc } from 'firebase/firestore';
import { AlertCircle, CheckCircle, Loader2, MessageSquare, Search, ShieldCheck, XCircle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { DEMO_MODE, addDemoLocalData, getDemoLocalData, isPermissionError, updateDemoLocalData } from '../../lib/demo';
import { formatCurrency } from '../../lib/media';
import type { Enrollment, Order, PaymentSubmission } from '../../lib/types';

const STATUS_COLORS: Record<string, string> = {
  active: 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]',
  pending_payment: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
  cancelled: 'border-red-400/30 bg-red-500/10 text-red-300',
  completed: 'border-blue-400/30 bg-blue-500/10 text-blue-300',
  submitted: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
  verified: 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]',
  rejected: 'border-red-400/30 bg-red-500/10 text-red-300',
};

export default function AdminEnrollments() {
  const [tab, setTab] = useState<'requests' | 'enrollments'>('requests');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<PaymentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentSubmission['status']>('submitted');
  const [search, setSearch] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState<'approve' | 'reject'>('approve');
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [enrollmentSnapshot, orderSnapshot, requestSnapshot] = await Promise.all([
        getDocs(collection(db, 'enrollments')),
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'paymentSubmissions')),
      ]);
      setEnrollments(enrollmentSnapshot.docs.map(item => ({ id: item.id, ...item.data() })) as Enrollment[]);
      setOrders(orderSnapshot.docs.map(item => ({ id: item.id, ...item.data() })) as Order[]);
      setRequests(requestSnapshot.docs.map(item => ({ id: item.id, ...item.data() })) as PaymentSubmission[]);

      if (DEMO_MODE) {
        setEnrollments(previous => [...previous, ...getDemoLocalData('enrollments') as Enrollment[]]);
        setOrders(previous => [...previous, ...getDemoLocalData('orders') as Order[]]);
        setRequests(previous => [...previous, ...getDemoLocalData('paymentSubmissions') as PaymentSubmission[]]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, []);

  const orderById = useMemo(() => new Map(orders.filter(order => order.id).map(order => [order.id!, order])), [orders]);
  const pendingCount = requests.filter(request => request.status === 'submitted').length;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredRequests = requests
    .filter(request => statusFilter === 'all' || request.status === statusFilter)
    .filter(request => {
      const order = orderById.get(request.orderId);
      const searchable = `${request.userEmail} ${request.paymentNote || ''} ${order?.itemTitle || ''}`.toLowerCase();
      return !normalizedSearch || searchable.includes(normalizedSearch);
    })
    .sort((a, b) => b.submittedAt - a.submittedAt);

  const filteredEnrollments = enrollments.filter(enrollment => {
    const searchable = `${enrollment.userEmail} ${enrollment.courseTitle}`.toLowerCase();
    return !normalizedSearch || searchable.includes(normalizedSearch);
  });

  const openReview = (request: PaymentSubmission, mode: 'approve' | 'reject') => {
    setReviewingId(request.id || null);
    setReviewMode(mode);
    setAdminNote('');
  };

  const handleApprove = async (request: PaymentSubmission, order: Order) => {
    if (!request.id || !order.id) return;
    setActionLoading(request.id);
    try {
      try {
        await runTransaction(db, async transaction => {
          const requestRef = doc(db, 'paymentSubmissions', request.id!);
          const orderRef = doc(db, 'orders', order.id!);
          const [requestSnapshot, orderSnapshot] = await Promise.all([
            transaction.get(requestRef),
            transaction.get(orderRef),
          ]);

          if (!requestSnapshot.exists() || !orderSnapshot.exists()) throw new Error('Request or order no longer exists.');
          const currentRequest = requestSnapshot.data() as PaymentSubmission;
          const currentOrder = { id: orderSnapshot.id, ...orderSnapshot.data() } as Order;
          if (currentRequest.status !== 'submitted') throw new Error('This request has already been reviewed.');
          if (currentOrder.status !== 'pending') throw new Error('This order is no longer pending.');
          if (currentOrder.userId !== currentRequest.userId || currentOrder.amount !== currentRequest.amount) {
            throw new Error('The request does not match its order.');
          }

          const reviewedAt = Date.now();
          transaction.update(requestRef, { status: 'verified', reviewedAt, adminNote: adminNote.trim() });
          transaction.update(orderRef, { status: 'paid', paymentMethod: 'manual', updatedAt: reviewedAt });

          if (currentOrder.itemType === 'course') {
            transaction.set(doc(db, 'enrollments', `${currentRequest.userId}_${currentOrder.itemId}`), {
              userId: currentRequest.userId,
              userEmail: currentRequest.userEmail,
              courseId: currentOrder.itemId,
              courseTitle: currentOrder.itemTitle,
              enrollmentType: 'paid',
              status: 'active',
              progress: 0,
              enrolledAt: reviewedAt,
            }, { merge: true });
          }

          transaction.set(doc(db, 'payments', request.id!), {
            orderId: currentOrder.id,
            userId: currentRequest.userId,
            amount: currentRequest.amount,
            currency: currentOrder.currency,
            provider: 'manual',
            status: 'paid',
            createdAt: reviewedAt,
          });
        });
      } catch (error) {
        if (!DEMO_MODE || !isPermissionError(error)) throw error;
        const reviewedAt = Date.now();
        updateDemoLocalData('paymentSubmissions', request.id, { status: 'verified', reviewedAt, adminNote: adminNote.trim() });
        updateDemoLocalData('orders', order.id, { status: 'paid', paymentMethod: 'manual', updatedAt: reviewedAt });
        if (order.itemType === 'course') {
          addDemoLocalData('enrollments', {
            userId: request.userId,
            userEmail: request.userEmail,
            courseId: order.itemId,
            courseTitle: order.itemTitle,
            enrollmentType: 'paid',
            status: 'active',
            progress: 0,
            enrolledAt: reviewedAt,
          });
        }
      }
      setReviewingId(null);
      setAdminNote('');
      await fetchData();
    } catch (error) {
      console.error(error);
      alert('Could not approve this request. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (request: PaymentSubmission) => {
    if (!request.id) return;
    setActionLoading(request.id);
    try {
      const note = adminNote.trim() || 'Please send an updated payment confirmation message.';
      try {
        await updateDoc(doc(db, 'paymentSubmissions', request.id), {
          status: 'rejected',
          reviewedAt: Date.now(),
          adminNote: note,
        });
      } catch (error) {
        if (!DEMO_MODE || !isPermissionError(error)) throw error;
        updateDemoLocalData('paymentSubmissions', request.id, { status: 'rejected', reviewedAt: Date.now(), adminNote: note });
      }
      setReviewingId(null);
      setAdminNote('');
      await fetchData();
    } catch (error) {
      console.error(error);
      alert('Could not reject this request. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="flex items-center gap-2 py-10 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading approval queue...</div>;

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-center">
          <div className="text-2xl font-bold text-amber-300">{pendingCount}</div>
          <div className="text-[10px] font-bold uppercase text-slate-400">Awaiting approval</div>
        </div>
        <div className="rounded-xl border border-[#10B981]/20 bg-[#10B981]/10 p-4 text-center">
          <div className="text-2xl font-bold text-[#10B981]">{enrollments.filter(item => item.status === 'active').length}</div>
          <div className="text-[10px] font-bold uppercase text-slate-400">Active access</div>
        </div>
        <div className="col-span-2 rounded-xl border border-white/10 bg-white/5 p-4 text-center md:col-span-1">
          <div className="text-2xl font-bold text-white">{requests.length}</div>
          <div className="text-[10px] font-bold uppercase text-slate-400">Total requests</div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button type="button" onClick={() => setTab('requests')} className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${tab === 'requests' ? 'bg-[#2563EB] text-white' : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>
          Approval Requests {pendingCount > 0 && <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] text-slate-900">{pendingCount}</span>}
        </button>
        <button type="button" onClick={() => setTab('enrollments')} className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${tab === 'enrollments' ? 'bg-[#2563EB] text-white' : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>
          Course Access
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {tab === 'requests' && (
          <div className="flex flex-wrap gap-2">
            {(['submitted', 'verified', 'rejected', 'all'] as const).map(status => (
              <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${statusFilter === status ? 'border border-white/20 bg-white/15 text-white' : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                {status === 'all' ? 'All' : status === 'submitted' ? 'Pending' : status}
              </button>
            ))}
          </div>
        )}
        <label className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search student or course..." className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-xs text-white outline-none focus:border-blue-400 sm:w-56" />
        </label>
      </div>

      {tab === 'requests' && (
        <div className="space-y-4">
          {filteredRequests.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
              <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-slate-500" />
              <p className="text-sm text-slate-500">No approval requests found.</p>
            </div>
          )}
          {filteredRequests.map(request => {
            const order = orderById.get(request.orderId);
            const isReviewing = reviewingId === request.id;
            return (
              <article key={request.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-white">{order?.itemTitle || 'Order no longer available'}</h3>
                    <p className="mt-1 text-xs text-slate-400">{request.userEmail} · {formatCurrency(request.amount)} · {new Date(request.submittedAt).toLocaleString('en-BD')}</p>
                  </div>
                  <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_COLORS[request.status] || 'border-white/10 text-slate-300'}`}>{request.status}</span>
                </div>

                <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-4">
                  <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500"><MessageSquare className="h-3.5 w-3.5" /> Student message</div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{request.paymentNote || 'No message was included with this legacy request.'}</p>
                </div>

                {request.status === 'rejected' && request.adminNote && (
                  <div className="mt-3 flex gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs text-red-200"><AlertCircle className="h-4 w-4 shrink-0" /> {request.adminNote}</div>
                )}
                {request.status === 'verified' && (
                  <div className="mt-3 flex gap-2 rounded-xl border border-[#10B981]/20 bg-[#10B981]/10 px-4 py-3 text-xs text-[#10B981]"><CheckCircle className="h-4 w-4 shrink-0" /> Approved and access activated.</div>
                )}

                {request.status === 'submitted' && order && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    {isReviewing ? (
                      <div className="space-y-3">
                        <textarea rows={3} maxLength={500} value={adminNote} onChange={event => setAdminNote(event.target.value)} placeholder={reviewMode === 'approve' ? 'Admin note (optional)' : 'Tell the student what to update'} className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-blue-400" />
                        <div className="flex flex-wrap gap-2">
                          {reviewMode === 'approve' ? (
                            <button type="button" onClick={() => void handleApprove(request, order)} disabled={actionLoading === request.id} className="flex items-center gap-1 rounded-lg bg-[#10B981] px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"><CheckCircle className="h-3.5 w-3.5" /> {actionLoading === request.id ? 'Approving...' : 'Approve & Activate'}</button>
                          ) : (
                            <button type="button" onClick={() => void handleReject(request)} disabled={actionLoading === request.id} className="flex items-center gap-1 rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"><XCircle className="h-3.5 w-3.5" /> {actionLoading === request.id ? 'Rejecting...' : 'Reject Request'}</button>
                          )}
                          <button type="button" onClick={() => { setReviewingId(null); setAdminNote(''); }} className="px-3 py-2 text-xs text-slate-400 hover:text-white">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => openReview(request, 'approve')} className="flex items-center gap-1 rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-2 text-xs font-bold text-[#10B981] hover:bg-[#10B981]/20"><CheckCircle className="h-3.5 w-3.5" /> Approve Access</button>
                        <button type="button" onClick={() => openReview(request, 'reject')} className="flex items-center gap-1 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20"><XCircle className="h-3.5 w-3.5" /> Ask for Update</button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {tab === 'enrollments' && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-white">
              <thead className="bg-black/20 text-xs text-slate-400"><tr><th className="p-3">Student</th><th className="p-3">Course</th><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">Approved</th></tr></thead>
              <tbody>
                {filteredEnrollments.map(enrollment => <tr key={enrollment.id} className="border-t border-white/5 text-xs"><td className="p-3 text-slate-300">{enrollment.userEmail}</td><td className="p-3 font-medium">{enrollment.courseTitle}</td><td className="p-3 capitalize text-slate-400">{enrollment.enrollmentType}</td><td className="p-3"><span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[enrollment.status] || ''}`}>{enrollment.status.replace('_', ' ')}</span></td><td className="p-3 text-slate-400">{new Date(enrollment.enrolledAt).toLocaleDateString('en-BD')}</td></tr>)}
                {filteredEnrollments.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-sm text-slate-500">No course access found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
