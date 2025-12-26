'use client';

import { motion } from 'framer-motion';

export function BrandLogos() {
  const logos = [
    { name: 'Purlin', url: '#' },
    { name: 'Fusion', url: '#' },
    { name: 'Cigna', url: '#' },
    { name: 'Oscar', url: '#' },
    { name: 'Allianz', url: '#' },
    { name: 'MetLife', url: '#' },
    { name: 'Prudential', url: '#' },
  ];

  return (
    <section className="py-12 bg-[#0a0a0f] border-y border-white/5 overflow-hidden">
      <div className="container mx-auto px-6">
        <p className="text-center text-sm font-medium text-gray-500 uppercase tracking-widest mb-8">
          Trusted by businesses worldwide
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          {logos.map((logo, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-white/20 rounded-lg" />
              <span className="text-xl font-bold text-white tracking-tighter uppercase">{logo.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
