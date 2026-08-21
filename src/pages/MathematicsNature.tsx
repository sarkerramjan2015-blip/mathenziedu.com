import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MATHEMATICS_NATURE_CONTENT, articles as dummyArticles } from '../lib/data';
import { motion } from 'motion/react';
import { Shapes, ChevronRight, BookOpen, Eye, Brain, TreePine, Sparkles } from 'lucide-react';
import type { Article } from '../lib/types';
import SEO from '../components/SEO';

const SUBCATEGORIES = ['All', 'Articles', 'Visual Learning', 'Real-life Mathematics', 'Nature Patterns'];

const SUBCAT_ICONS: Record<string, React.ElementType> = {
  'Articles': BookOpen,
  'Visual Learning': Eye,
  'Real-life Mathematics': Brain,
  'Nature Patterns': TreePine,
};

const SUBCAT_COLORS: Record<string, string> = {
  'Articles': 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  'Visual Learning': 'text-violet-400 border-violet-500/30 bg-violet-500/10',
  'Real-life Mathematics': 'text-lime-400 border-lime-500/30 bg-lime-500/10',
  'Nature Patterns': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
};

const TOPIC_GRADIENTS: Record<string, string> = {
  'Nature Patterns': 'from-rose-500/10 via-fuchsia-500/5 to-transparent',
  'Visual Learning': 'from-violet-500/10 via-indigo-500/5 to-transparent',
  'Real-life Mathematics': 'from-lime-500/10 via-green-500/5 to-transparent',
  'Articles': 'from-amber-500/10 via-orange-500/5 to-transparent',
};

export default function MathematicsNature() {
  const [filter, setFilter] = useState('All');

  const content = MATHEMATICS_NATURE_CONTENT;
  const filteredContent = filter === 'All' ? content : content.filter(c => c.topic === filter);
  const relatedArticles = dummyArticles.filter(a => (a.mainCategory || a.category) === 'Mathematics and Nature');

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
        title="Mathematics & Nature"
        description="Discover the hidden mathematical patterns in nature — Fibonacci, Golden Ratio, Symmetry, Fractals, and more with Mathenzi Edu."
        path="/mathematics-and-nature"
      />
      <div className="min-h-screen py-12 relative z-10 w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Shapes className="h-4 w-4" /> Mathematics & Nature
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white mb-4 tracking-tight">
            Math is <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400">Everywhere</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed">
            Discover the hidden mathematical patterns in nature — from the spiral of a shell to the symmetry of a snowflake.
            Mathematics is not just a subject; it is the language of the universe.
          </p>
        </motion.div>

        {/* Subcategory Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {SUBCATEGORIES.map(sub => {
            const Icon = SUBCAT_ICONS[sub] || Shapes;
            return (
              <button
                key={sub}
                onClick={() => setFilter(sub)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  filter === sub
                    ? `${SUBCAT_COLORS[sub] || 'bg-white/10 text-white border-white/20'} scale-105 shadow-lg`
                    : 'bg-white/5 text-slate-300 border border-white/10 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <Icon className="h-4 w-4" /> {sub}
              </button>
            );
          })}
        </div>

        {/* Content Grid */}
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredContent.map(item => (
            <motion.div key={item.id} variants={itemVariants}
              className={`bg-gradient-to-br ${TOPIC_GRADIENTS[item.topic] || 'from-white/5 to-white/5'} border border-white/10 hover:border-white/20 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-2 flex flex-col h-full group`}>
              <div className="relative h-48 overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute top-3 left-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${SUBCAT_COLORS[item.topic] || 'bg-white/10 text-white border-white/20'}`}>
                    {item.topic}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 text-3xl">{item.emoji}</div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-bold text-lg leading-tight mb-3 text-white group-hover:text-amber-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed flex-grow">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Topic Highlights */}
        <section className="py-12 mb-12">
          <h2 className="text-3xl font-display font-bold text-white mb-8 text-center">Explore Topics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Fibonacci Sequence', sub: 'Nature Patterns', emoji: '🐚', desc: 'Numbers in spirals & growth' },
              { label: 'Golden Ratio', sub: 'Nature Patterns', emoji: '✨', desc: 'Phi in art & nature' },
              { label: 'Symmetry', sub: 'Visual Learning', emoji: '🦋', desc: 'Mirror & radial patterns' },
              { label: 'Fractals', sub: 'Real-life Mathematics', emoji: '❄️', desc: 'Infinite self-similarity' },
              { label: 'Hexagons', sub: 'Visual Learning', emoji: '🐝', desc: 'Honeycomb efficiency' },
              { label: 'Sine Waves', sub: 'Real-life Mathematics', emoji: '🌊', desc: 'Waves & oscillations' },
              { label: 'Flower Petals', sub: 'Articles', emoji: '🌻', desc: 'Fibonacci in petals' },
              { label: 'Shell Spirals', sub: 'Nature Patterns', emoji: '🐌', desc: 'Logarithmic spirals' },
            ].map((topic, i) => (
              <button
                key={i}
                onClick={() => setFilter(topic.sub)}
                className="bg-white/5 border border-white/10 hover:border-amber-500/30 rounded-2xl p-5 text-left transition-all hover:bg-white/10 hover:-translate-y-1 group"
              >
                <div className="text-2xl mb-2">{topic.emoji}</div>
                <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">{topic.label}</h4>
                <p className="text-[10px] text-slate-500 mt-1">{topic.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="py-8 border-t border-white/10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-display font-bold text-white">Related Articles</h2>
              <Link to="/articles?mainCategory=Mathematics+and+Nature" className="text-sm font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.slice(0, 3).map(article => (
                <Link key={article.id} to={`/articles/${article.id}`}
                  className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors group">
                  <span className="text-xs font-bold text-rose-400 mb-2 block uppercase">{article.subCategory || article.category}</span>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-rose-300 transition-colors">{article.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-3">{article.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
    </>
  );
}
