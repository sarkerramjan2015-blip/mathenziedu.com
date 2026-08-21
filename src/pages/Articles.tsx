import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { articles as defaultArticles } from '../lib/data';
import type { Article } from '../lib/types';
import { applyImageFallback, imageWithFallback } from '../lib/media';
import SEO from '../components/SEO';

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const q = query(collection(db, 'articles'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setArticles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Article[]);
        } else {
          setArticles(defaultArticles);
        }
      } catch (error) {
        console.error(error);
        setArticles(defaultArticles);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  return (
    <>
      <SEO 
        title="Articles"
        description="Explore Mathenzi Edu's articles on mathematics philosophy, visual learning, nature patterns, and real-life mathematical applications."
        path="/articles"
      />
      <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-semibold mb-6 border border-blue-500/20">
            <BookOpen className="h-4 w-4" /> Mathenzi Blog
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold mb-6 tracking-tight">
            Insights & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Articles</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Discover the beauty of mathematics through our curated articles, exploring philosophy, history, careers, and fun puzzles.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, i) => (
              <motion.div 
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 hover:border-white/20 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all duration-300 group flex flex-col h-full"
              >
                <div className="relative h-48 overflow-hidden shrink-0">
                  <img src={imageWithFallback(article.image)} onError={applyImageFallback} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                  {(article.mainCategory || article.category) && (
                    <div className="absolute top-4 left-4 flex gap-1.5">
                      <span className="bg-black/40 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white">
                        {article.mainCategory || article.category}
                      </span>
                      {article.subCategory && (
                        <span className="bg-blue-500/20 backdrop-blur-md border border-blue-400/30 px-2.5 py-1 rounded-full text-[10px] font-semibold text-blue-300">
                          {article.subCategory}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-bold text-xl leading-tight mb-3 text-white group-hover:text-[#3B82F6] transition-colors duration-300">
                    {article.title}
                  </h3>
                  <p className="text-slate-400 text-sm line-clamp-3 mb-6 flex-grow">
                    {article.description}
                  </p>
                  <div className="mt-auto">
                    <Link to={`/articles/${article.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                      Read Full Article <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
