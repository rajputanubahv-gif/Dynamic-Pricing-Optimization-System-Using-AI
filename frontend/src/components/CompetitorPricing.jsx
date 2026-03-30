import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function CompetitorPricing({ ourPrice }) {
  const [competitors, setCompetitors] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const scanCompetitors = () => {
    setIsScanning(true);
    // Simulate network delay for effect
    setTimeout(() => {
      // Mock competitor prices relative to our predicted price
      // If we don't have a price yet, default to $20.00 base estimation
      const base = ourPrice ? parseFloat(ourPrice) : 20.00;
      
      const mockData = [
        { name: 'UberX', price: (base * (1 + (Math.random() * 0.15 - 0.05))).toFixed(2), trend: Math.random() > 0.5 ? 'up' : 'down' },
        { name: 'Lyft Standard', price: (base * (1 + (Math.random() * 0.12 - 0.08))).toFixed(2), trend: Math.random() > 0.5 ? 'up' : 'down' },
        { name: 'Local Taxi', price: (base * 1.25).toFixed(2), trend: 'stable' }
      ];
      
      setCompetitors(mockData.sort((a,b) => parseFloat(a.price) - parseFloat(b.price)));
      setIsScanning(false);
    }, 1500);
  };

  // Re-scan if our price changes
  useEffect(() => {
    if(ourPrice) {
      scanCompetitors();
    } else {
      setCompetitors([]);
    }
  }, [ourPrice]);

  return (
    <motion.div 
      className="glass-card" 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{ padding: '1.5rem', height: '100%' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📡 Competitor Radar
        </h3>
        <button 
          onClick={scanCompetitors} 
          disabled={isScanning}
          style={{
            background: 'var(--accent)',
            border: 'none',
            color: '#fff',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            cursor: isScanning ? 'not-allowed' : 'pointer',
            opacity: isScanning ? 0.7 : 1,
            fontSize: '0.8rem',
            fontWeight: '600'
          }}
        >
          {isScanning ? 'Scanning...' : 'Refresh'}
        </button>
      </div>

      {!ourPrice && competitors.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0', fontSize: '0.9rem' }}>
          Generate a prediction to see live competitor prices for this route.
        </div>
      )}

      {isScanning ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px' }}>
          <div style={{ 
            width: '40px', height: '40px', 
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
          {competitors.map((comp, idx) => (
            <motion.div 
              key={comp.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.8rem 1rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                borderLeft: `4px solid ${
                  ourPrice && parseFloat(ourPrice) < parseFloat(comp.price) ? 'var(--success)' : 
                  ourPrice && parseFloat(ourPrice) > parseFloat(comp.price) ? 'var(--warning)' : 
                  'var(--accent)'
                }`
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>{comp.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {comp.trend === 'up' ? '↗️ Trending Up' : comp.trend === 'down' ? '↘️ Trending Down' : '➡️ Stable'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>${comp.price}</span>
                {ourPrice && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: parseFloat(ourPrice) < parseFloat(comp.price) ? 'var(--success)' : 'var(--warning)' 
                  }}>
                    {parseFloat(ourPrice) < parseFloat(comp.price) 
                      ? `${((1 - parseFloat(ourPrice)/parseFloat(comp.price))*100).toFixed(1)}% cheaper` 
                      : `${((parseFloat(ourPrice)/parseFloat(comp.price) - 1)*100).toFixed(1)}% higher`}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}

export default CompetitorPricing;
