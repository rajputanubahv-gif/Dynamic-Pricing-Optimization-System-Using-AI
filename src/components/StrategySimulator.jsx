import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const StrategySimulator = ({ payload }) => {
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (payload) {
      runSimulation();
    }
  }, [payload]);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/simulate', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSimulation(response.data);
      setError(null);
    } catch (err) {
      console.error("Simulation failed:", err);
      setError("Simulator offline. Check backend logic.");
    } finally {
      setLoading(false);
    }
  };

  if (!payload && !simulation) return (
    <div className="p-8 text-center text-slate-500 italic">
      Waiting for market parameters to initialize simulation hub...
    </div>
  );

  const strategies = [
    { key: 'Revenue Max', icon: '💰', title: 'Revenue Max', colorRgb: '239, 68, 68', variant: 'Profit-First' },
    { key: 'Balanced', icon: '⚖️', title: 'Balanced', colorRgb: '99, 102, 241', variant: 'Equilibrium' },
    { key: 'Volume Push', icon: '🚀', title: 'Volume Push', colorRgb: '16, 185, 129', variant: 'Market Share' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end px-1">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Intelligence Simulator <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded uppercase tracking-widest border border-indigo-500/30">Alpha 3.0</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-tighter">Parallel Operational Outcomes for {payload?.City || 'Current Market'}</p>
        </div>
        <button 
          onClick={runSimulation}
          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
        >
          {loading ? 'Recalculating...' : 'Refresh Sim'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatePresence>
          {strategies.map((strat, idx) => {
            const outcome = simulation?.outcomes?.[strat.key];
            const isRecommended = simulation?.recommended === strat.key;

            return (
              <motion.div
                key={strat.key}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: idx * 0.1, type: 'spring', damping: 20 }}
                className={`relative group p-5 rounded-3xl border transition-all duration-500 ${isRecommended ? 'border-white/20' : 'border-white/5 shadow-2xl'} backdrop-blur-3xl overflow-hidden`}
                style={{ 
                   background: isRecommended ? `rgba(${strat.colorRgb}, 0.08)` : 'rgba(255, 255, 255, 0.02)'
                }}
              >
                {/* Glow Effect */}
                <div 
                  className="absolute -inset-24 opacity-0 group-hover:opacity-10 transition-opacity duration-1000 blur-3xl pointer-events-none"
                  style={{ background: `radial-gradient(circle, rgb(${strat.colorRgb}) 0%, transparent 60%)` }}
                />

                <div className="relative flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-white/5" style={{ backgroundColor: `rgba(${strat.colorRgb}, 0.2)` }}>
                      {strat.icon}
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white uppercase tracking-tight">{strat.title}</h3>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{strat.variant}</p>
                    </div>
                  </div>
                  {isRecommended && (
                    <div className="px-2 py-0.5 bg-indigo-500 rounded-full text-[8px] font-black text-white uppercase">Active</div>
                  )}
                </div>

                {loading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-8 bg-white/5 rounded w-3/4" />
                    <div className="h-4 bg-white/5 rounded w-1/2" />
                    <div className="h-10 bg-white/5 rounded" />
                  </div>
                ) : outcome ? (
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Projected Revenue</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white">₹{Math.round(outcome.projected_revenue).toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500 font-mono">/session</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                       <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                          <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Bookings</p>
                          <p className="text-xs font-bold text-white">{outcome.expected_bookings}</p>
                       </div>
                       <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                          <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Surge Target</p>
                          <p className="text-xs font-bold text-white">{outcome.surge_multiplier}x</p>
                       </div>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-tight italic line-clamp-2">
                      {outcome.explanation}
                    </p>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-600 italic py-8">Calculation error in simulation...</div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StrategySimulator;
