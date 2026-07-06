import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Bookmark } from 'lucide-react';
import { motion } from 'motion/react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { articles as defaultArticles } from '../lib/data';
import type { Article } from '../lib/types';
import { applyImageFallback, imageWithFallback } from '../lib/media';

export default function ArticleDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'articles', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setArticle({ id: docSnap.id, ...docSnap.data() } as Article);
        } else {
          setArticle(defaultArticles.find(item => item.id === id) || null);
        }

        if (user) {
          const savedRef = doc(db, 'users', user.uid, 'savedArticles', id);
          const savedSnap = await getDoc(savedRef);
          if (savedSnap.exists()) {
            setSaved(true);
          }
        }
      } catch (error) {
        console.error(error);
        setArticle(defaultArticles.find(item => item.id === id) || null);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id, user]);

  const handleSave = async () => {
    if (!user || !id) return alert('Please login to save articles.');
    try {
      if (!saved) {
        await setDoc(doc(db, 'users', user.uid, 'savedArticles', id), {
          articleId: id,
          savedAt: Date.now()
        });
        setSaved(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Article Not Found</h1>
          <Link to="/articles" className="text-blue-400 hover:text-blue-300">Return to Articles</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/articles" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Articles
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-semibold border border-blue-500/20">
                <BookOpen className="h-4 w-4" /> {article.mainCategory || article.category || 'Article'}
              </div>
              {article.subCategory && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-semibold border border-blue-500/20">
                  {article.subCategory}
                </div>
              )}
            </div>
            
            <button 
              onClick={handleSave}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${saved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}
            >
              <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} /> 
              {saved ? 'Saved' : 'Save Article'}
            </button>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold mb-8 text-white tracking-tight">
            {article.title}
          </h1>
          
          <div className="relative h-[300px] md:h-[400px] w-full rounded-3xl overflow-hidden mb-12 border border-white/10">
            <img 
              src={imageWithFallback(article.image)} 
              onError={applyImageFallback}
              alt={article.title} 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="prose prose-invert prose-lg max-w-none text-slate-300">
            {/* If content is complex html/markdown, normally we use react-markdown, 
                for now we just split by double newline as simple paragraphs */}
            {article.content ? (
              article.content.split('\n\n').map((para: string, idx: number) => (
                <p key={idx} className="mb-6 leading-relaxed bg-white/5 border border-white/10 p-6 rounded-2xl">{para}</p>
              ))
            ) : (
               <p className="mb-6 leading-relaxed bg-white/5 border border-white/10 p-6 rounded-2xl">{article.description}</p>
            )}
           </div>
        </motion.div>
      </div>
    </div>
  );
}
