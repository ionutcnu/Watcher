'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Target, ScrollText, BarChart3 } from 'lucide-react';

export function FeaturesSection() {
  const shouldReduceMotion = useReducedMotion();
  const features = [
    {
      icon: Target,
      title: 'Real-Time Monitoring',
      description: 'Automatic hourly scans for up to 50 clans. Get instant notifications via Discord when members join or leave.',
      comingSoon: true,
    },
    {
      icon: ScrollText,
      title: 'Complete History',
      description: 'Access full member movement history. Track recruitment patterns and identify active periods.',
      comingSoon: false,
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Export data to CSV, view statistics, and analyze clan growth trends over time.',
      comingSoon: false,
    },
  ];

  return (
    <div className="mt-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: "'Oswald', 'Roboto Condensed', sans-serif" }}>
        Key Features
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={shouldReduceMotion ? {} : { y: 20, opacity: 0 }}
            animate={shouldReduceMotion ? {} : { y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative group"
          >
            {/* Camo Top Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF8C00] via-[#CC5500] to-[#FF8C00]" />

            {/* Card */}
            <div className="h-full bg-gradient-to-br from-[#27272a] to-[#18181b] border-2 border-[#3f3f46] rounded-xl p-8 text-center transition-all duration-300 group-hover:border-[#FF8C00] group-hover:shadow-[0_10px_40px_rgba(255,140,0,0.3)] group-hover:-translate-y-2">
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF8C00] to-[#CC5500] flex items-center justify-center shadow-lg">
                  <feature.icon className="w-10 h-10 text-white" strokeWidth={2} />
                </div>
              </div>

              {/* Title */}
              <h4 className="text-xl font-bold text-[#FF8C00] mb-3 flex items-center justify-center gap-2">
                {feature.title}
                {feature.comingSoon && (
                  <span className="text-xs font-semibold px-2 py-1 bg-gradient-to-r from-[#FF8C00] to-[#CC5500] text-white rounded-full uppercase tracking-wide">
                    Coming Soon
                  </span>
                )}
              </h4>

              {/* Description */}
              <p className="text-[#a1a1aa] leading-relaxed">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
