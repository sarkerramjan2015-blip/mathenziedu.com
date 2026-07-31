import React from 'react';
import { motion } from 'motion/react';
import { Target, Eye, Heart, Users, Zap, BookOpen } from 'lucide-react';
import SEO from '../components/SEO';
import { useSiteSettings } from '../lib/useSiteConfig';

export default function About() {
  const site = useSiteSettings();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <>
      <SEO 
        title="About"
        description="Learn about Mathemzi Edu — Bangladesh's premium mathematics learning platform. Mission, vision, values, and our commitment to math education."
        path="/about"
      />
      <div className="min-h-screen py-20 relative z-10 w-full overflow-hidden text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">{site.aboutTitle}</h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            {site.aboutIntro}
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 mb-20"
        >
          <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm hover:shadow-[0_0_30px_rgba(37,99,235,0.15)] transition-shadow duration-500">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                <Target className="h-6 w-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">{site.missionTitle}</h2>
            </div>
            <p className="leading-relaxed">
              {site.missionText}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-shadow duration-500">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30">
                <Eye className="h-6 w-6 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">{site.visionTitle}</h2>
            </div>
            <p className="leading-relaxed">
              {site.visionText}
            </p>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-center text-white mb-12">Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Knowledge", icon: BookOpen, desc: "Pursuing deep, foundational understanding over rote memorization.", color: "text-blue-400" },
              { title: "Empowerment", icon: Zap, desc: "Giving learners the tools to solve problems independently.", color: "text-amber-400" },
              { title: "Community", icon: Heart, desc: "Building a supportive environment of passionate learners.", color: "text-rose-400" },
              { title: "Excellence", icon: Target, desc: "Striving for the highest quality in every lesson and exam.", color: "text-emerald-400" }
            ].map((value, i) => (
              <div key={i} className="bg-black/20 border border-white/5 p-6 rounded-2xl text-center hover:bg-black/40 hover:-translate-y-2 transition-all duration-300">
                <value.icon className={`h-8 w-8 mx-auto mb-4 ${value.color}`} />
                <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                <p className="text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12"
        >
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              Target Audience
            </h2>
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
                <h4 className="font-bold text-white text-lg">Students</h4>
                <p className="text-sm mt-1">School and college students looking for academic excellence and exam preparation.</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
                <h4 className="font-bold text-white text-lg">Job Seekers</h4>
                <p className="text-sm mt-1">Professionals aiming to master job mathematics, mental math, and viva preparation.</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
                <h4 className="font-bold text-white text-lg">Lifelong Learners</h4>
                <p className="text-sm mt-1">Anyone passionate about logical reasoning, Math Olympiad, and public speaking.</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Zap className="h-8 w-8 text-emerald-500" />
              Key Features
            </h2>
            <ul className="space-y-4">
              {site.aboutFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="font-medium text-white">{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

      </div>
    </div>
    </>
  );
}
