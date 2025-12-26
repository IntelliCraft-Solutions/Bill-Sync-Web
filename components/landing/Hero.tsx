'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Play, CheckCircle } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span className="text-sm font-medium text-gray-300">New: Inventory Analytics 2.0</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight"
          >
            Modern Billing for{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6]">
              Ambitious Teams.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-400 mb-10 max-w-2xl"
          >
            Streamline your inventory, automate billing, and gain deep insights into your business with our all-in-one management platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-16"
          >
            <Link
              href="/auth/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] text-white rounded-full font-semibold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 hover:opacity-90 transition-all group"
            >
              Start My Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              Request a Demo
            </Link>
          </motion.div>

          {/* Trusted Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-semibold text-white tracking-widest uppercase">Purlin</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-semibold text-white tracking-widest uppercase">Fusion</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-semibold text-white tracking-widest uppercase">Cigna</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-semibold text-white tracking-widest uppercase">Allianz</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
