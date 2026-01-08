'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';

export function Pricing() {
    const plans = [
      {
        name: 'Free Trial',
        price: '0',
        description: 'Perfect for small shops starting their digital journey.',
        features: [
          'Up to 10 products',
          'Up to 15 bills/month',
          '1 admin account',
          '3 cashier accounts',
          'Basic sales reports',
          'Email support'
        ],
        cta: 'Start Free Trial',
        href: '/auth/register?plan=FREE_TRIAL',
        popular: false
      },
      {
        name: 'Standard',
        price: '1,499',
        description: 'Advanced tools for growing retail businesses.',
        features: [
          'Unlimited products',
          'Unlimited bills',
          'Up to 5 admin accounts',
          'Up to 20 cashier accounts',
          'Advanced analytics',
          'Priority support',
          'Custom branding',
          '1GB cloud storage'
        ],
        cta: 'Get Started',
        href: '/auth/register?plan=STANDARD',
        popular: true
      },
      {
        name: 'Professional',
        price: '2,999',
        description: 'Enterprise features for large scale operations.',
        features: [
          'Everything in Standard',
          'Unlimited admin accounts',
          'Unlimited cashier accounts',
          'API access',
          'White-label option',
          'Dedicated account manager',
          'Custom integrations',
          '10GB cloud storage'
        ],
        cta: 'Get Started',
        href: '/auth/register?plan=PROFESSIONAL',
        popular: false
      }
    ];

  return (
    <section id="pricing" className="py-24 bg-[#0f0f1a] relative">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6 text-white"
          >
            Simple, Transparent{' '}
            <span className="text-purple-500">Pricing.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg"
          >
            Choose the plan that fits your business needs. No hidden fees, cancel anytime.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-8 rounded-3xl border ${
                plan.popular 
                  ? 'bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border-purple-500/50 shadow-2xl shadow-purple-500/10' 
                  : 'bg-white/5 border-white/10'
              } flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-xs font-bold text-white flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" />
                  MOST POPULAR
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">₹{plan.price}</span>
                  <span className="text-gray-400">/month</span>
                </div>
              </div>

              <div className="space-y-4 mb-10 flex-grow">
                {plan.features.map((feature, fIndex) => (
                  <div key={fIndex} className="flex items-start gap-3">
                    <div className="mt-1 p-0.5 bg-green-500/20 rounded-full text-green-500">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href={plan.href}
                className={`w-full py-4 rounded-xl font-bold text-center transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 shadow-lg shadow-purple-500/20'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
