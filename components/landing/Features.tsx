'use client';

import { motion } from 'framer-motion';
import { 
  Package, 
  Receipt, 
  BarChart3, 
  Users2, 
  ShieldCheck, 
  Zap,
  Globe,
  Database
} from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Track stock levels, set low-stock alerts, and manage product categories effortlessly.'
    },
    {
      icon: Receipt,
      title: 'Billing & Invoicing',
      description: 'Generate professional bills in seconds. Support for GST and multiple payment modes.'
    },
    {
      icon: BarChart3,
      title: 'Sales Reports',
      description: 'Gain insights with detailed sales analytics, product performance, and revenue tracking.'
    },
    {
      icon: Users2,
      title: 'Employee Management',
      description: 'Create cashier accounts with restricted access and track their individual performance.'
    },
    {
      icon: ShieldCheck,
      title: 'Enhanced Security',
      description: 'Enterprise-grade protection to keep your business data safe and compliant.'
    },
    {
      icon: Zap,
      title: 'Scalable Architecture',
      description: 'Flexible solutions that grow as your business expands, from one to multiple outlets.'
    },
    {
      icon: Globe,
      title: 'Multi-device Sync',
      description: 'Access your data from anywhere. Real-time sync between desktop and mobile devices.'
    },
    {
      icon: Database,
      title: 'Data Backup',
      description: 'Automatic daily backups in the cloud ensure your data is always recoverable.'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <section id="features" className="py-24 bg-[#0a0a0f] relative">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6 text-white"
          >
            Powerful Features for{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
              Complete Control.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg"
          >
            Everything you need to manage your retail business, all in one intuitive platform.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.08] hover:border-purple-500/50 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6" />
              </div>
              
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-purple-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
