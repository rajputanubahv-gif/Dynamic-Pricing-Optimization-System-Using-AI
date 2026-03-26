import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PriceWaterfall = ({ data, dark = true }) => {
  if (!data) return null;

  // Components of the Waterfall (Simulated or calculated from data)
  const steps = [
    { label: 'Base Fare', value: data.baseFare || 50, color: '#6366f1' },
    { label: 'Distance', value: data.distanceCost || (data.distance_km * 12) || 0, color: '#8b5cf6' },
    { label: 'Fuel Index', value: data.fuelAdjustment || 0, color: '#f59e0b' },
    { label: 'Surge Factor', value: (data.predicted_price - (data.baseFare || 50) - (data.distanceCost || (data.distance_km * 12) || 0) - (data.fuelAdjustment || 0) - (data.sustainability_offset || 0)), color: '#ef4444' },
    { label: 'Sustainability', value: data.sustainability_offset || 0, color: '#10b981' },
  ].filter(s => Math.abs(s.value) > 0.1);

  const total = data.predicted_price || 0;
  let runningTotal = 0;

  return (
    <div className={`p-6 rounded-2xl ${dark ? 'bg-slate-900/50' : 'bg-white/50'} backdrop-blur-xl border border-white/10`}>
      <h3 className="text-sm font-medium text-slate-400 mb-6 uppercase tracking-wider">Price Waterfall Explainability</h3>
      
      <div className="space-y-4 relative">
        <AnimatePresence>
          {steps.map((step, idx) => {
            const startVal = runningTotal;
            runningTotal += step.value;
            const endVal = runningTotal;
            
            // Calculate percentage width relative to total
            const width = (Math.abs(step.value) / total) * 100;
            const left = (startVal / total) * 100;

            return (
              <motion.div 
                key={step.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-24 text-xs font-medium text-slate-300 truncate">{step.label}</div>
                <div className="flex-1 h-8 bg-slate-800/30 rounded-lg relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%`, left: `${left}%` }}
                    style={{ backgroundColor: step.color }}
                    className="absolute h-full rounded shadow-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                    {step.value > 0 ? '+' : ''}₹{Math.abs(step.value).toFixed(1)}
                  </div>
                </div>
                <div className="w-16 text-right text-xs font-mono text-slate-500">
                  ₹{endVal.toFixed(0)}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Final Total Line */}
        <div className="pt-4 border-t border-white/5 flex justify-between items-center mt-2">
          <span className="text-xs font-bold text-slate-100 italic uppercase">Final Dynamic Price</span>
          <motion.span 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400"
          >
            ₹{total.toFixed(2)}
          </motion.span>
        </div>
      </div>
    </div>
  );
};

export default PriceWaterfall;
