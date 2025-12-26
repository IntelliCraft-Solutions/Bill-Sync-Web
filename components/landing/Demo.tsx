'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Monitor, Smartphone, ShieldCheck } from 'lucide-react';

export function Demo() {
  return (
    <section id="demo" className="py-24 relative overflow-hidden bg-[#0a0a0f]">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            Behind Every Great Result Is a{' '}
            <span className="text-purple-500">Process That Just Works.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg"
          >
            Cut repetitive tasks, reduce errors, and boost productivity. Our automation lets your team focus on what truly matters.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-3xl blur-2xl" />
            <div className="relative bg-[#16213e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-[#0f172a] px-4 py-2 flex items-center gap-2 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="mx-auto text-xs text-gray-500 font-mono">app.billsync.com/dashboard</div>
              </div>
              <div className="p-2">
                <img
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/image-1766776384620.png"
                  alt="App Dashboard"
                  className="rounded-lg shadow-inner"
                />
              </div>
            </div>

            {/* Floating Stats Card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -right-6 bg-[#1a1a2e]/90 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl hidden md:block"
            >
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                  <ArrowRight className="w-6 h-6 -rotate-45" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">10x</div>
                  <div className="text-xs text-gray-400">Faster Billing</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Desktop Optimized</h3>
                <p className="text-gray-400">A simple, secure, standalone desktop solution for your back-office needs.</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Mobile Companion</h3>
                <p className="text-gray-400">Carry your accounts wherever you go with our fully responsive mobile web app.</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Real-time Insights</h3>
                <p className="text-gray-400">Instant analytics and recommendations to support smarter business decisions.</p>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 text-purple-400 font-semibold hover:text-purple-300 transition-colors group"
              >
                Explore Demo Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
