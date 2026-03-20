import { useEffect,useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion, AnimatePresence } from "framer-motion";
import API from "../api";

function PredictionHistory({ refreshTrigger }){
  const [predictions,setPredictions]=useState([]);
  const token = localStorage.getItem("token");

  useEffect(()=>{
    fetchHistory();
  },[refreshTrigger])

  const fetchHistory = () => {
    API.get("/predictions").then(res=>{
      setPredictions(res.data);
    }).catch(err => {
      console.error("Failed to fetch history:", err);
    });
  }

  const handleDelete = async (id) => {
    try {
      if(window.confirm("Are you sure you want to delete this prediction?")) {
        await API.delete(`/predictions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Remove from local state immediately to avoid refetching Everything
        setPredictions(predictions.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete prediction:", err);
      alert("Error deleting prediction.");
    }
  }

  const handleClearAll = async () => {
    try {
      if(window.confirm("WARNING: Are you sure you want to delete ALL prediction history? This cannot be undone.")) {
        await API.delete(`/predictions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Clear local state immediately
        setPredictions([]);
      }
    } catch (err) {
      console.error("Failed to clear history:", err);
      alert("Error clearing history.");
    }
  }

  const exportToCSV = () => {
    if (predictions.length === 0) {
      alert("No data to export.");
      return;
    }
    const headers = ["ID", "Predicted Price (INR)", "Surge Multiplier", "Demand Level"];
    const csvRows = [headers.join(",")];
    
    predictions.forEach(p => {
      const row = [p.id, p.predicted_price, p.surge_multiplier, p.demand_level];
      csvRows.push(row.join(","));
    });
    
    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'pricing_analytics_report.csv');
    a.click();
  }

  return(
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card" 
      style={{ overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      
      {/* Chart Section */}
      <div>
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          Trend Analysis
        </h3>
        {predictions.length > 0 ? (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={predictions} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSurge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="id" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                <YAxis yAxisId="left" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: '#fff', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.5)', padding: '12px' }}
                  itemStyle={{ color: '#fff', fontWeight: '500', padding: '4px 0' }}
                  labelStyle={{ color: 'var(--text-secondary)', marginBottom: '8px' }}
                />
                <Legend verticalAlign="top" height={36}/>
                <Area yAxisId="left" type="monotone" dataKey="predicted_price" name="Price (₹)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} />
                <Area yAxisId="right" type="monotone" dataKey="surge_multiplier" name="Surge (x)" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorSurge)" activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>No data available to generate charts. Make a prediction first!</p>
        )}
      </div>

      {/* Table Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
            Prediction History
          </h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {predictions.length > 0 && (
              <button 
                onClick={exportToCSV}
                style={{ 
                  background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#3b82f6', 
                  padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'; }}
              >
                <span style={{ fontSize: '1rem' }}>📥</span> Export CSV
              </button>
            )}
            {token && predictions.length > 0 && (
              <button 
                onClick={handleClearAll}
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', 
                  padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'; }}
              >
                <span style={{ fontSize: '1rem' }}>🗑️</span> Clear All History
              </button>
            )}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <th style={{ padding: '1rem 0', fontWeight: '500' }}>ID</th>
            <th style={{ padding: '1rem 0', fontWeight: '500' }}>Price (₹)</th>
            <th style={{ padding: '1rem 0', fontWeight: '500' }}>Surge</th>
            <th style={{ padding: '1rem 0', fontWeight: '500' }}>Demand</th>
            {token && <th style={{ padding: '1rem 0', fontWeight: '500', textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
          {predictions.map((p, index)=>(
            <motion.tr 
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, backgroundColor: "rgba(239, 68, 68, 0.2)" }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s' }} 
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'} 
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>#{p.id}</td>
              <td style={{ padding: '1rem 0', fontWeight: '500' }}>{p.predicted_price}</td>
              <td style={{ padding: '1rem 0' }}>
                <span style={{ 
                  backgroundColor: p.surge_multiplier > 1.5 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)', 
                  color: p.surge_multiplier > 1.5 ? 'var(--warning)' : 'var(--success)', 
                  padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: '500'
                }}>
                  {p.surge_multiplier}x
                </span>
              </td>
              <td style={{ padding: '1rem 0' }}>Level {p.demand_level}</td>
              {token && (
                <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                  <button 
                    onClick={() => handleDelete(p.id)}
                    style={{ 
                      background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', 
                      padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
                  >
                    Delete
                  </button>
                </td>
              )}
            </motion.tr>
          ))}
          </AnimatePresence>
        </tbody>
      </table>
      </div>
    </motion.div>
  )
}

export default PredictionHistory;