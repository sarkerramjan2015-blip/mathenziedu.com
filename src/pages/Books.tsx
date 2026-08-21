import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { books as dummyBooks } from '../lib/data';
import { Search, ChevronRight, BookOpen, Download, ShoppingCart, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEMO_MODE, addDemoLocalData, isPermissionError } from '../lib/demo';
import type { Book, Order } from '../lib/types';
import { applyImageFallback, formatCurrency, imageWithFallback } from '../lib/media';
import { useAuth } from '../lib/AuthContext';
import SEO from '../components/SEO';
import ManualApprovalRequest from '../components/ManualApprovalRequest';

const SUBCATEGORIES = ['All', 'Academic Books', 'Olympiad Books', 'Admission Books', 'Practice Books', 'Formula Sheets', 'PDF Resources', 'Model Test Books'];

const SUBCAT_COLORS: Record<string, string> = {
  'Academic Books': 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  'Olympiad Books': 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
  'Admission Books': 'text-teal-400 border-teal-500/30 bg-teal-500/10',
  'Practice Books': 'text-pink-400 border-pink-500/30 bg-pink-500/10',
};

const SUBCAT_BADGE: Record<string, string> = {
  'Academic Books': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Olympiad Books': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'Admission Books': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'Practice Books': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
};

export default function Books() {
  const [searchParams] = useSearchParams();
  const urlSub = searchParams.get('subCategory') || '';
  const [filter, setFilter] = useState(urlSub || 'All');
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState<Book[]>(dummyBooks);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [orderMsg, setOrderMsg] = useState<{ bookId: string; type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [ordering, setOrdering] = useState<string | null>(null);
  const [createdOrders, setCreatedOrders] = useState<Record<string, Order>>({});

  useEffect(() => {
    if (urlSub) setFilter(urlSub);
  }, [urlSub]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const snap = await getDocs(collection(db, 'books'));
        if (!snap.empty) {
          setBooks(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Book[]);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return books.filter(b => {
      const matchSub = filter === 'All' || b.subCategory === filter;
      const searchable = `${b.title} ${b.author} ${b.description} ${b.subCategory} ${b.classOrLevel || ''}`.toLowerCase();
      return matchSub && (!q || searchable.includes(q));
    });
  }, [books, filter, searchTerm]);

  const classLevels = useMemo(() => {
    const all = books.map(b => b.classOrLevel).filter(Boolean) as string[];
    return [...new Set(all)];
  }, [books]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <>
      <SEO 
        title="Books Corner"
        description="Browse Mathenzi Edu's Books Corner — academic textbooks, olympiad problem books, admission guides, and practice workbooks for mathematics students."
        path="/books"
      />
      <div className="min-h-screen py-12 relative z-10 w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider mb-4">
            <BookOpen className="h-4 w-4" /> Books Corner
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Books Corner</h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Browse academic textbooks, olympiad problem books, admission guides, and practice workbooks — all in one place.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex flex-wrap gap-2">
            {SUBCATEGORIES.map(sub => (
              <button
                key={sub}
                onClick={() => setFilter(sub)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  filter === sub
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white/5 text-slate-300 border border-white/10 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                {sub.replace(' Books', '')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {classLevels.length > 0 && (
              <select
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="hidden md:block px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Levels</option>
                {classLevels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            )}
            <div className="w-full md:w-56 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search books..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Book Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
            <BookOpen className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-400 mb-2">No books found</h3>
            <button onClick={() => { setFilter('All'); setSearchTerm(''); }} className="text-purple-400 font-bold hover:underline">Clear filters</button>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(book => (
              <motion.div key={book.id} variants={itemVariants}
                className="bg-white/5 border border-white/10 hover:border-white/20 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-2 flex flex-col h-full group">
                {/* Cover Image */}
                <div className="relative h-56 overflow-hidden bg-gradient-to-b from-black/20 to-black/40">
                  <img src={imageWithFallback(book.coverImage)} onError={applyImageFallback} alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {/* Free badge */}
                  {book.isFree && (
                    <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-400/50 shadow-lg">
                      FREE
                    </div>
                  )}
                  {/* Subcategory badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${SUBCAT_BADGE[book.subCategory] || 'bg-white/10 text-white border-white/20'}`}>
                      {book.subCategory}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg leading-tight mb-1 text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-sm text-slate-400 mb-1">by {book.author}</p>
                  {book.classOrLevel && (
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{book.classOrLevel}</span>
                  )}

                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-grow">{book.description}</p>

                  {/* Price + Actions */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
                    <div className="font-bold text-lg text-purple-400">
                      {book.isFree ? <span className="text-emerald-400">Free</span> : formatCurrency(book.price)}
                    </div>
                    <div className="flex gap-2">
                      {book.isFree && (
                        book.downloadUrl && book.downloadUrl !== '#' ? (
                          <a href={book.downloadUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600/30 transition-all">
                            <Download className="h-3.5 w-3.5" /> Download
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-500 px-2 py-1">Resource coming soon</span>
                        )
                      )}
                      {!book.isFree && <button
                        onClick={async () => {
                          if (!user) { setOrderMsg({ bookId: book.id, type: 'error', text: 'Please login to purchase.' }); return; }
                          setOrdering(book.id);
                          setOrderMsg(null);
                          try {
                            const orderData: Omit<Order, 'id'> = {
                              userId: user.uid,
                              userEmail: user.email || '',
                              itemType: 'book',
                              itemId: book.id,
                              itemTitle: book.title,
                              amount: book.price,
                              currency: 'BDT',
                              status: 'pending',
                              paymentMethod: 'bkash_manual',
                              createdAt: Date.now(),
                            };
                            try {
                              const orderRef = await addDoc(collection(db, 'orders'), orderData);
                              const newOrder: Order = { id: orderRef.id, ...orderData };
                              setCreatedOrders(prev => ({ ...prev, [book.id]: newOrder }));
                            } catch (e) {
                              if (DEMO_MODE && isPermissionError(e)) {
                                const savedOrder = addDemoLocalData('orders', orderData) as Order;
                                setCreatedOrders(prev => ({ ...prev, [book.id]: savedOrder }));
                              } else {
                                throw e;
                              }
                            }
                            setOrderMsg({ bookId: book.id, type: 'success', text: DEMO_MODE ? 'Order created! (Demo mode: saved locally only.)' : 'Order created. Complete payment, then send a message for admin approval.' });
                          } catch {
                            setOrderMsg({ bookId: book.id, type: 'error', text: 'Something went wrong. Try again.' });
                          } finally { setOrdering(null); }
                        }}
                        disabled={ordering === book.id}
                        className="flex items-center gap-1 bg-purple-600/20 text-purple-400 border border-purple-500/30 px-3 py-2 rounded-xl text-xs font-bold hover:bg-purple-600/30 transition-all disabled:opacity-50"
                      >
                        {ordering === book.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                        {ordering === book.id ? '...' : 'Buy'}
                      </button>}
                    </div>
                  </div>
                  {orderMsg && orderMsg.bookId === book.id && (
                    <div className={`mt-3 text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                      orderMsg.type === 'success' ? 'text-emerald-400 bg-emerald-500/10' :
                      orderMsg.type === 'error' ? 'text-red-400 bg-red-500/10' :
                      'text-[#F59E0B] bg-[#F59E0B]/10'
                    }`}>
                      {orderMsg.type === 'success' ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {orderMsg.text}
                    </div>
                  )}
                  {/* Manual approval request for paid book orders */}
                  {!book.isFree && createdOrders[book.id] && user && (
                    <div className="mt-4">
                      <ManualApprovalRequest
                        order={createdOrders[book.id]}
                        userId={user.uid}
                        userEmail={user.email || ''}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
    </>
  );
}
