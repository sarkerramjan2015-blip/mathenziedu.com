import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, runTransaction } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CheckCircle, XCircle, Search, Smartphone, AlertCircle, MessageSquare } from 'lucide-react';
import { L } from '../../lib/i18n';
import { DEMO_MODE, getDemoLocalData, addDemoLocalData, updateDemoLocalData, isPermissionError } from '../../lib/demo';
import type { Enrollment, Order, PaymentSubmission } from '../../lib/types';
import { formatCurrency } from '../../lib/media';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30',
  pending_payment: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30',
  cancelled: 'bg-red-500/10 text-red-400 border-red-400/30',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-400/30',
  pending: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30',
  paid: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30',
  failed: 'bg-red-500/10 text-red-400 border-red-400/30',
  submitted: 'bg-[#3B82F6]/10 text-blue-400 border-blue-400/30',
  verified: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30',
  rejected: 'bg-red-500/10 text-red-400 border-red-400/30',
};

export default function AdminEnrollments() {
  const [tab, setTab] = useState<'enrollments' | 'orders' | 'submissions'>('enrollments');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [rejecting, setRejecting] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [enrSnap, ordSnap, subSnap] = await Promise.all([
        getDocs(collection(db, 'enrollments')),
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'paymentSubmissions')),
      ]);
      setEnrollments(enrSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Enrollment[]);
      setOrders(ordSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[]);
      setSubmissions(subSnap.docs.map(d => ({ id: d.id, ...d.data() })) as PaymentSubmission[]);

      // Merge demo localStorage data if available
      if (DEMO_MODE) {
        setEnrollments(prev => [...prev, ...getDemoLocalData('enrollments') as Enrollment[]]);
        setOrders(prev => [...prev, ...getDemoLocalData('orders') as Order[]]);
        setSubmissions(prev => [...prev, ...getDemoLocalData('paymentSubmissions') as PaymentSubmission[]]);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleVerify = async (sub: PaymentSubmission) => {
    if (!sub.id || !sub.orderId) return;
    setActionLoading(sub.id);
    try {
      try {
        await runTransaction(db, async transaction => {
          const submissionRef = doc(db, 'paymentSubmissions', sub.id!);
          const orderRef = doc(db, 'orders', sub.orderId);
          const [submissionSnapshot, orderSnapshot] = await Promise.all([
            transaction.get(submissionRef),
            transaction.get(orderRef),
          ]);

          if (!submissionSnapshot.exists() || !orderSnapshot.exists()) throw new Error('Payment or order no longer exists.');
          const currentSubmission = submissionSnapshot.data() as PaymentSubmission;
          const currentOrder = { id: orderSnapshot.id, ...orderSnapshot.data() } as Order;
          if (currentSubmission.status !== 'submitted') throw new Error('This payment has already been reviewed.');
          if (currentOrder.status !== 'pending') throw new Error('This order is not pending.');
          if (currentOrder.userId !== currentSubmission.userId || currentOrder.amount !== currentSubmission.amount) {
            throw new Error('Payment details do not match the order.');
          }

          const reviewedAt = Date.now();
          transaction.update(submissionRef, { status: 'verified', reviewedAt, adminNote: adminNote.trim() });
          transaction.update(orderRef, { status: 'paid', paymentMethod: 'bkash_manual', updatedAt: reviewedAt });

          if (currentOrder.itemType === 'course') {
            const enrollmentRef = doc(db, 'enrollments', `${currentSubmission.userId}_${currentOrder.itemId}`);
            transaction.set(enrollmentRef, {
              userId: currentSubmission.userId,
              userEmail: currentSubmission.userEmail,
              courseId: currentOrder.itemId,
              courseTitle: currentOrder.itemTitle,
              enrollmentType: 'paid',
              status: 'active',
              progress: 0,
              enrolledAt: reviewedAt,
            }, { merge: true });
          }

          transaction.set(doc(db, 'payments', sub.id!), {
            orderId: sub.orderId,
            userId: currentSubmission.userId,
            amount: currentSubmission.amount,
            currency: 'BDT',
            provider: 'bkash_manual',
            status: 'paid',
            transactionId: currentSubmission.transactionId,
            createdAt: reviewedAt,
          });
        });
      } catch (e) {
        if (DEMO_MODE && isPermissionError(e)) {
          // Demo fallback: update localStorage records
          updateDemoLocalData('paymentSubmissions', sub.id, { status: 'verified', reviewedAt: Date.now(), adminNote: adminNote || '' });
          updateDemoLocalData('orders', sub.orderId, { status: 'paid', paymentMethod: 'bkash_manual', updatedAt: Date.now() });
          
          const order = orders.find(o => o.id === sub.orderId);
          if (order && order.itemType === 'course') {
            addDemoLocalData('enrollments', { userId: sub.userId, userEmail: sub.userEmail, courseId: order.itemId, courseTitle: order.itemTitle, enrollmentType: 'paid', status: 'active', progress: 0, enrolledAt: Date.now() });
          }
          addDemoLocalData('payments', { orderId: sub.orderId, userId: sub.userId, amount: sub.amount, currency: 'BDT', provider: 'bkash_manual', status: 'paid', transactionId: sub.transactionId, createdAt: Date.now() });
        } else {
          throw e;
        }
      }

      setConfirming(null);
      setAdminNote('');
      fetchData();
    } catch (e) { console.error(e); alert('Error verifying payment'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (sub: PaymentSubmission) => {
    if (!sub.id) return;
    setActionLoading(sub.id);
    try {
      try {
        await updateDoc(doc(db, 'paymentSubmissions', sub.id), {
          status: 'rejected', reviewedAt: Date.now(), adminNote: adminNote || 'Payment rejected by admin.',
        });
      } catch (e) {
        if (DEMO_MODE && isPermissionError(e)) {
          updateDemoLocalData('paymentSubmissions', sub.id, { status: 'rejected', reviewedAt: Date.now(), adminNote: adminNote || 'Payment rejected by admin.' });
        } else { throw e; }
      }
      setRejecting(null);
      setAdminNote('');
      fetchData();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const filteredEnrollments = enrollments.filter(e => {
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    const q = search.toLowerCase();
    return matchStatus && (!q || e.courseTitle.toLowerCase().includes(q) || e.userEmail.toLowerCase().includes(q));
  });
  const filteredOrders = orders.filter(o => {
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    const q = search.toLowerCase();
    return matchStatus && (!q || o.itemTitle.toLowerCase().includes(q) || o.userEmail.toLowerCase().includes(q));
  });
  const filteredSubmissions = submissions.filter(s => {
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    const q = search.toLowerCase();
    return matchStatus && (!q || s.transactionId.toLowerCase().includes(q) || s.userEmail.toLowerCase().includes(q) || s.senderBkashNumber.includes(q));
  });

  if (loading) return <div className="text-slate-400">Loading...</div>;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
          <div className="text-2xl font-bold text-white">{enrollments.length}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase">Enrollments</div>
        </div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
          <div className="text-2xl font-bold text-[#10B981]">{enrollments.filter(e => e.status === 'active').length}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase">Active</div>
        </div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
          <div className="text-2xl font-bold text-[#F59E0B]">{orders.filter(o => o.status === 'pending').length}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase">Pending Orders</div>
        </div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
          <div className="text-2xl font-bold text-[#3B82F6]">{submissions.filter(s => s.status === 'submitted').length}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase">Pending Verify</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => { setTab('enrollments'); setStatusFilter('All'); }}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'enrollments' ? 'bg-[#2563EB] text-white shadow-lg' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}>
          Enrollments ({enrollments.length})
        </button>
        <button onClick={() => { setTab('orders'); setStatusFilter('All'); }}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'orders' ? 'bg-[#2563EB] text-white shadow-lg' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}>
          Orders ({orders.length})
        </button>
        <button onClick={() => { setTab('submissions'); setStatusFilter('submitted'); }}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'submissions' ? 'bg-[#E2136E] text-white shadow-lg' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}>
          bKash Submissions ({submissions.length})
          {submissions.filter(s => s.status === 'submitted').length > 0 && (
            <span className="ml-1.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{submissions.filter(s => s.status === 'submitted').length}</span>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {(tab === 'submissions' ? ['All', 'submitted', 'verified', 'rejected'] : tab === 'enrollments' ? ['All', 'active', 'pending_payment', 'cancelled', 'completed'] : ['All', 'pending', 'paid', 'failed', 'cancelled']).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === s ? 'bg-white/20 text-white border border-white/20' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'}`}>{s === 'All' ? 'All' : s.replace(/_/g, ' ')}</button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="w-full sm:w-48 pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#2563EB] placeholder:text-slate-500" />
        </div>
      </div>

      {/* Enrollments Table */}
      {tab === 'enrollments' && (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-left text-white"><thead className="bg-black/20"><tr><th className="p-3 text-xs">User</th><th className="p-3 text-xs">Course</th><th className="p-3 text-xs">Type</th><th className="p-3 text-xs">Status</th><th className="p-3 text-xs">Date</th></tr></thead>
            <tbody>{filteredEnrollments.map(e => (
              <tr key={e.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-3 text-xs text-slate-300">{e.userEmail}</td>
                <td className="p-3 text-xs font-medium">{e.courseTitle}</td>
                <td className="p-3"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${e.enrollmentType === 'free' ? 'text-emerald-400 bg-emerald-500/10' : 'text-[#F59E0B] bg-[#F59E0B]/10'}`}>{e.enrollmentType}</span></td>
                <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[e.status] || ''}`}>{e.status.replace(/_/g, ' ')}</span></td>
                <td className="p-3 text-xs text-slate-400">{new Date(e.enrolledAt).toLocaleDateString()}</td>
              </tr>
            ))}{filteredEnrollments.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500 text-sm">None found.</td></tr>}</tbody>
          </table>
        </div>
      )}

      {/* Orders Table */}
      {tab === 'orders' && (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-left text-white"><thead className="bg-black/20"><tr><th className="p-3 text-xs">User</th><th className="p-3 text-xs">Item</th><th className="p-3 text-xs">Amount</th><th className="p-3 text-xs">Method</th><th className="p-3 text-xs">Status</th><th className="p-3 text-xs text-right">Action</th></tr></thead>
            <tbody>{filteredOrders.map(o => (
              <tr key={o.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-3 text-xs text-slate-300">{o.userEmail}</td>
                <td className="p-3 text-xs font-medium">{o.itemTitle}</td>
                <td className="p-3 text-xs font-bold">{formatCurrency(o.amount)}</td>
                <td className="p-3 text-xs text-slate-400">{o.paymentMethod}</td>
                <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[o.status] || ''}`}>{o.status}</span></td>
                <td className="p-3 text-right">
                  {o.status === 'pending' && (
                    <button onClick={() => { setConfirming(o.id || ''); setAdminNote(''); }}
                      className="text-[10px] font-bold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 px-3 py-1 rounded hover:bg-[#F59E0B]/30 transition-all">
                      Mark Paid (Manual)
                    </button>
                  )}
                  {o.status === 'paid' && <span className="text-[10px] text-[#10B981] flex items-center gap-1 justify-end"><CheckCircle className="h-3 w-3" /> Paid</span>}
                </td>
              </tr>
            ))}{filteredOrders.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500 text-sm">None found.</td></tr>}</tbody>
          </table>
          {/* Manual Mark Paid confirmation */}
          {confirming && !submissions.find(s => s.orderId === confirming) && (
            <div className="border-t border-white/10 p-4 bg-white/5">
              {(() => { const order = orders.find(o => o.id === confirming); if (!order) return null;
                return (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-slate-300">Mark <strong>{order.itemTitle}</strong> as paid manually?</span>
                    <input placeholder="Note (optional)" value={adminNote} onChange={e => setAdminNote(e.target.value)}
                      className="text-xs bg-black/30 border border-white/10 rounded px-2 py-1 text-white w-40" />
                    <button onClick={() => { handleVerify({ id: order.id, orderId: order.id, userId: order.userId, userEmail: order.userEmail, amount: order.amount, senderBkashNumber: 'manual', transactionId: 'manual', status: 'submitted', submittedAt: Date.now() } as PaymentSubmission); setConfirming(null); }}
                      className="text-[10px] font-bold bg-[#10B981] text-white px-3 py-1.5 rounded hover:bg-emerald-500 transition-all">Confirm</button>
                    <button onClick={() => setConfirming(null)} className="text-[10px] text-slate-400 px-2 py-1">Cancel</button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* bKash Submissions Tab */}
      {tab === 'submissions' && (
        <div className="space-y-4">
          {filteredSubmissions.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <Smartphone className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No payment submissions found.</p>
            </div>
          )}
          {filteredSubmissions.map(sub => (
            <div key={sub.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h4 className="font-bold text-white text-sm">{sub.userEmail}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Order: {sub.orderId?.slice(-8)} · ৳{sub.amount.toLocaleString('en-BD')}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[sub.status] || ''}`}>{sub.status}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 mb-0.5">Sender bKash</div>
                  <div className="font-bold text-white font-mono">{sub.senderBkashNumber}</div>
                </div>
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 mb-0.5">Transaction ID</div>
                  <div className="font-bold text-white font-mono">{sub.transactionId}</div>
                </div>
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 mb-0.5">Submitted</div>
                  <div className="font-bold text-white">{new Date(sub.submittedAt).toLocaleString('en-BD')}</div>
                </div>
              </div>

              {sub.paymentNote && <p className="text-xs text-slate-500 mb-3">Note: {sub.paymentNote}</p>}

              {/* Admin actions */}
              {sub.status === 'submitted' && (
                <div className="border-t border-white/10 pt-4">
                  {confirming === sub.id ? (
                    <div className="space-y-3">
                      <input placeholder="Admin note (optional)" value={adminNote} onChange={e => setAdminNote(e.target.value)}
                        className="w-full text-xs bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-slate-600" />
                      <div className="flex gap-2">
                        <button onClick={() => handleVerify(sub)} disabled={actionLoading === sub.id}
                          className="flex items-center gap-1 bg-[#10B981] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-emerald-500 transition-all disabled:opacity-50">
                          <CheckCircle className="h-3.5 w-3.5" /> {actionLoading === sub.id ? '...' : 'Verify & Activate'}
                        </button>
                        <button onClick={() => { setRejecting(sub.id); setAdminNote(''); }}
                          className="flex items-center gap-1 bg-red-500/20 text-red-400 text-xs font-bold px-4 py-2 rounded-lg border border-red-400/30 hover:bg-red-500/30 transition-all">
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button onClick={() => { setConfirming(null); setAdminNote(''); }} className="text-xs text-slate-400 px-3 py-2">Cancel</button>
                      </div>
                    </div>
                  ) : rejecting === sub.id ? (
                    <div className="space-y-3">
                      <input placeholder="Reason for rejection (visible to user)" value={adminNote} onChange={e => setAdminNote(e.target.value)}
                        className="w-full text-xs bg-black/30 border border-red-400/30 rounded-lg px-3 py-2 text-white placeholder:text-slate-600" />
                      <div className="flex gap-2">
                        <button onClick={() => handleReject(sub)} disabled={actionLoading === sub.id}
                          className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-600 transition-all disabled:opacity-50">
                          <XCircle className="h-3.5 w-3.5" /> {actionLoading === sub.id ? '...' : 'Confirm Reject'}
                        </button>
                        <button onClick={() => { setRejecting(null); setAdminNote(''); }} className="text-xs text-slate-400 px-3 py-2">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setConfirming(sub.id); setAdminNote(''); }}
                      className="flex items-center gap-1 bg-[#10B981]/20 text-[#10B981] text-xs font-bold px-4 py-2 rounded-lg border border-[#10B981]/30 hover:bg-[#10B981]/30 transition-all">
                      <CheckCircle className="h-3.5 w-3.5" /> Verify Payment
                    </button>
                  )}
                </div>
              )}

              {sub.status === 'rejected' && sub.adminNote && (
                <div className="border-t border-white/10 pt-3 text-xs text-red-400 flex items-start gap-2">
                  <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>Admin note: {sub.adminNote}</span>
                </div>
              )}

              {sub.status === 'verified' && (
                <div className="border-t border-white/10 pt-3 text-xs text-[#10B981] flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5" /> Verified. Order marked as paid.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
