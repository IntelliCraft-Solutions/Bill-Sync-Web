'use client';

import { motion } from 'framer-motion';
import { Target, Users, Zap, Shield } from 'lucide-react';

export function About() {
  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To empower small and medium businesses with enterprise-grade tools that are simple, affordable, and effective.'
    },
    {
      icon: Users,
      title: 'Customer First',
      description: 'We build features based on real feedback from business owners like you, ensuring we solve actual problems.'
    },
    {
      icon: Zap,
      title: 'Speed & Efficiency',
      description: 'Our platform is designed to minimize clicks and maximize output, saving you hours of administrative work.'
    },
    {
      icon: Shield,
      title: 'Data Security',
      description: 'Your business data is encrypted and backed up daily, ensuring you never have to worry about data loss.'
    }
  ];

  return (
    <section id="about" className="py-24 bg-[#0f0f1a] relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-1/2"
          >
            <h2 className="text-sm font-semibold text-purple-500 uppercase tracking-widest mb-4">Tailored for You</h2>
            <h3 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
              An accounting solution for every need and every business.
            </h3>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              BillSync started with a simple idea: making business management accessible to everyone. Whether you're a small-scale business or a mid-market enterprise, our platform scales with you.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
                >
                  <value.icon className="w-8 h-8 text-purple-500 mb-4" />
                  <h4 className="text-lg font-bold mb-2 text-white">{value.title}</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="lg:w-1/2 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" />
            <img
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/image-1766776388271.png"
              alt="Business Solutions"
              className="relative rounded-3xl shadow-2xl border border-white/10"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
