import { useState, useEffect } from 'react';

function CompetitorPricing({ prediction }) {
  const [competitors, setCompetitors] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const scanCompetitors = () => {
    setIsScanning(true);
    setTimeout(() => {
      const uber = prediction?.uber_radar ?? prediction?.uber_price;
      const ola = prediction?.ola_radar ?? prediction?.ola_price;
      
      if (uber !== undefined && ola !== undefined && uber !== null && ola !== null) {
        setCompetitors([
          { name: 'Uber Radar', price: Number(uber || 0).toFixed(2) },
          { name: 'Ola Radar', price: Number(ola || 0).toFixed(2) },
          { name: 'Market Avg', price: (Number(uber + ola || 0) / 2).toFixed(2) }
        ]);
      } else {
        const base = prediction?.predicted_price ? parseFloat(prediction.predicted_price) : 240.00;
        const mockData = [
          { name: 'Uber (Est)', price: (base * (1 + (Math.random() * 0.15 - 0.05))).toFixed(2) },
          { name: 'Ola (Est)', price: (base * (1 + (Math.random() * 0.12 - 0.08))).toFixed(2) },
          { name: 'Local Taxi', price: (base * 1.25).toFixed(2) }
        ];
        setCompetitors(mockData.sort((a,b) => parseFloat(a.price) - parseFloat(b.price)));
      }
      setIsScanning(false);
    }, 1000);
  };

  useEffect(() => {
    if(prediction) scanCompetitors();
    else setCompetitors([]);
  }, [prediction]);

  return (
    <div className="glass-card" style={{ padding: '1.5rem', height: '100%', minHeight: '200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>📡 Competitor Radar</h3>
        <button 
          onClick={scanCompetitors} 
          disabled={isScanning}
          style={{
            background: 'var(--accent)',
            border: 'none',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '4px',
            cursor: isScanning ? 'not-allowed' : 'pointer',
            fontSize: '11px',
            fontWeight: 600
          }}
        >
          {isScanning ? 'Scanning...' : 'Refresh'}
        </button>
      </div>

      {!prediction && competitors.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0', fontSize: '12px' }}>
          Generate a prediction to see live competitor prices in ₹ for this route.
        </div>
      )}

      {isScanning ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
           <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Syncing market data...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {competitors.map((comp) => (
            <div 
              key={comp.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '6px',
                border: '1px solid var(--border-color)'
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{comp.name}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>₹{comp.price}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CompetitorPricing;
