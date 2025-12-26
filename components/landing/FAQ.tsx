'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

export function FAQ() {
  const faqs = [
    {
      question: 'How does the free trial work?',
      answer: 'Our free trial gives you full access to all features of the Professional plan for 14 days. No credit card is required to start. After the trial, you can choose to upgrade or move to our forever-free Standard plan.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, UPI, and net banking through our secure payment gateway (Razorpay).'
    },
    {
      question: 'Can I upgrade or downgrade my plan at any time?',
      answer: 'Yes, you can change your plan at any time from your account settings. Upgrades take effect immediately, while downgrades will be applied at the end of your current billing cycle.'
    },
    {
      question: 'Is my business data secure?',
      answer: 'Absolutely. We use enterprise-grade encryption for all data transfers and storage. Your data is backed up daily and hosted on secure cloud infrastructure.'
    },
    {
      question: 'Do you offer a mobile app?',
      answer: 'BillSync is a progressive web app (PWA), which means it works perfectly on any mobile browser and can be "installed" on your home screen for a native-like experience.'
    },
    {
      question: 'Can I export my data?',
      answer: 'Yes, you can export your inventory, sales reports, and customer data to CSV or Excel formats at any time.'
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-[#0a0a0f] relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-white mb-6"
          >
            Frequently Asked Questions
          </motion.h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="border border-white/10 rounded-2xl overflow-hidden bg-white/5"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-all"
              >
                <span className="font-bold text-white">{faq.question}</span>
                {openIndex === index ? (
                  <Minus className="w-5 h-5 text-purple-500" />
                ) : (
                  <Plus className="w-5 h-5 text-purple-500" />
                )}
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
