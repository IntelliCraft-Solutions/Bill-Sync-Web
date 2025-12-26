'use client';

import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { motion } from 'framer-motion';
import { Download, Monitor, Smartphone, Globe, CheckCircle2 } from 'lucide-react';

export default function DownloadsPage() {
  const platforms = [
    {
      name: 'Windows',
      icon: <Monitor className="w-8 h-8" />,
      version: 'v2.4.1',
      size: '64MB',
      description: 'The complete desktop experience with offline support and thermal printer integration.',
      primaryBtn: 'Download for Windows',
      secondaryBtn: 'MSI Installer',
      isPopular: true
    },
    {
      name: 'macOS',
      icon: <Globe className="w-8 h-8" />,
      version: 'v2.4.1',
      size: '58MB',
      description: 'Native Apple Silicon and Intel support. Fast, fluid, and integrated with macOS features.',
      primaryBtn: 'Download for Mac',
      secondaryBtn: 'DMG Package',
      isPopular: false
    },
    {
      name: 'Android',
      icon: <Smartphone className="w-8 h-8" />,
      version: 'v1.8.0',
      size: '22MB',
      description: 'Manage your inventory and view reports on the go. Mobile billing for small shops.',
      primaryBtn: 'Get it on Play Store',
      secondaryBtn: 'Download APK',
      isPopular: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
            >
              Get BillSync for your device
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-400 max-w-2xl mx-auto"
            >
              Download our native applications for the best performance, offline capabilities, 
              and seamless hardware integration.
            </motion.p>
          </div>

          {/* Platforms Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {platforms.map((platform, idx) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className={`relative p-8 rounded-2xl border ${
                  platform.isPopular 
                    ? 'border-indigo-500/50 bg-indigo-500/5' 
                    : 'border-white/10 bg-white/5'
                } hover:border-indigo-500/50 transition-colors group`}
              >
                {platform.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                
                <div className="bg-indigo-500/10 w-16 h-16 rounded-xl flex items-center justify-center text-indigo-500 mb-6 group-hover:scale-110 transition-transform">
                  {platform.icon}
                </div>
                
                <h3 className="text-2xl font-bold mb-2">{platform.name}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                  <span>{platform.version}</span>
                  <span>•</span>
                  <span>{platform.size}</span>
                </div>
                
                <p className="text-gray-400 mb-8 min-h-[80px]">
                  {platform.description}
                </p>
                
                <div className="space-y-3">
                  <button className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors">
                    <Download className="w-5 h-5" />
                    {platform.primaryBtn}
                  </button>
                  <button className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-semibold transition-colors">
                    {platform.secondaryBtn}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-2 gap-12 items-center py-20 border-t border-white/10">
            <div>
              <h2 className="text-3xl font-bold mb-6">Why use the desktop app?</h2>
              <ul className="space-y-4">
                {[
                  'Direct Thermal Printer Integration (USB & Bluetooth)',
                  'Full Offline Mode - sync data when you are back online',
                  'Keyboard Shortcuts for faster billing',
                  'Automated Daily Backups to local storage',
                  'Lower Latency and smoother UI performance'
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full"></div>
              <img 
                src="https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80" 
                alt="Desktop App Interface" 
                className="relative rounded-xl border border-white/10 shadow-2xl"
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
