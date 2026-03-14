function SecondaryMetrics({prediction}){
  if(!prediction) return null;

  return(
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        
        {/* Actual Price Card */}
        <div className="glass-card" style={{ padding: '1.25rem', borderColor: 'rgba(148, 163, 184, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase' }}>Actual Price</h3>
            <span style={{ fontSize: '1.25rem' }}>💵</span>
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'rgb(148, 163, 184)', margin: 0 }}>₹{prediction.actual_price}</p>
        </div>

        {/* Driver Availability Card */}
        <div className="glass-card" style={{ padding: '1.25rem', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase' }}>Driver Availability</h3>
            <span style={{ fontSize: '1.25rem' }}>🚗</span>
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'rgb(59, 130, 246)', margin: 0 }}>{prediction.driver_availability}</p>
        </div>

        {/* Rider Demand Card */}
        <div className="glass-card" style={{ padding: '1.25rem', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase' }}>Rider Demand</h3>
            <span style={{ fontSize: '1.25rem' }}>🚶</span>
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'rgb(139, 92, 246)', margin: 0 }}>{prediction.rider_demand}</p>
        </div>

        {/* Demand Supply Ratio Card */}
        <div className="glass-card" style={{ padding: '1.25rem', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase' }}>Demand Supply Ratio</h3>
            <span style={{ fontSize: '1.25rem' }}>⚖️</span>
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'rgb(6, 182, 212)', margin: 0 }}>{prediction.demand_supply_ratio}</p>
        </div>

        {/* Ride Duration Card */}
        <div className="glass-card" style={{ padding: '1.25rem', borderColor: 'rgba(20, 184, 166, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase' }}>Ride Duration</h3>
            <span style={{ fontSize: '1.25rem' }}>⏱️</span>
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'rgb(20, 184, 166)', margin: 0 }}>{prediction.ride_duration} mins</p>
        </div>

        {/* Model Confidence Card */}
        <div className="glass-card" style={{ padding: '1.25rem', borderColor: 'rgba(234, 179, 8, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase' }}>Model Confidence</h3>
            <span style={{ fontSize: '1.25rem' }}>🎯</span>
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'rgb(234, 179, 8)', margin: 0 }}>{prediction.model_confidence}%</p>
        </div>

      </div>

      {/* AI Explanation Card */}
      <div className="glass-card" style={{ padding: '1.5rem', borderColor: 'rgba(99, 102, 241, 0.4)', background: 'rgba(99, 102, 241, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🧠</span>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>AI Explanation</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}>
          {prediction.ai_explanation}
        </p>
      </div>

    </div>
  )
}

export default SecondaryMetrics;
