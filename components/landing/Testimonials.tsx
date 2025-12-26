'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

export function Testimonials() {
  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Owner, RK Electronics',
      content: 'BillSync transformed how we manage our inventory. The low-stock alerts alone saved us from missing several big orders.',
      rating: 5,
      image: 'https://i.pravatar.cc/150?u=rajesh'
    },
    {
      name: 'Priya Sharma',
      role: 'Manager, Fashion Hub',
      content: 'The billing process is so much faster now. Our cashiers love the intuitive interface, and I love the detailed sales reports.',
      rating: 5,
      image: 'https://i.pravatar.cc/150?u=priya'
    },
    {
      name: 'Amit Patel',
      role: 'Director, Patel Groceries',
      content: 'Scaling to three outlets was seamless with BillSync. Being able to track everything from my phone is a game changer.',
      rating: 4,
      image: 'https://i.pravatar.cc/150?u=amit'
    }
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  const next = () => setActiveIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () => setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 bg-[#0a0a0f] relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6 text-white"
          >
            What Our Customers{' '}
            <span className="text-purple-500">Are Saying.</span>
          </motion.h2>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div className="absolute -top-10 -left-10 text-purple-500/10 hidden md:block">
            <Quote size={120} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/5 border border-white/10 p-8 md:p-12 rounded-3xl relative"
            >
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                <div className="flex-shrink-0">
                  <img
                    src={testimonials[activeIndex].image}
                    alt={testimonials[activeIndex].name}
                    className="w-20 h-20 rounded-full border-2 border-purple-500 shadow-lg shadow-purple-500/20"
                  />
                </div>
                <div>
                  <div className="flex justify-center md:justify-start gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < testimonials[activeIndex].rating ? 'text-yellow-500 fill-current' : 'text-gray-600'}
                      />
                    ))}
                  </div>
                  <p className="text-xl md:text-2xl text-gray-300 italic mb-6 leading-relaxed">
                    "{testimonials[activeIndex].content}"
                  </p>
                  <div>
                    <h4 className="text-lg font-bold text-white">{testimonials[activeIndex].name}</h4>
                    <p className="text-purple-400">{testimonials[activeIndex].role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-4 mt-10">
            <button
              onClick={prev}
              className="p-3 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="p-3 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
