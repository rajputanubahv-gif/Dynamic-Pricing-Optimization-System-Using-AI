import { useState } from 'react';
import FeedbackForm from './FeedbackForm';
import VoiceAssistant from './VoiceAssistant';

const PropertyRow = ({ label, value, color, isBold }) => (
  <div className="property-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <span className="property-label" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
    <span className="property-value" style={{ 
      color: color || 'var(--text-primary)', 
      fontWeight: isBold ? 700 : 500,
      fontSize: '12px'
    }}>{value}</span>
  </div>
);
function PricingCards({ prediction }) {
  const [showFeedback, setShowFeedback] = useState(false);
  if (!prediction) return (
    <div className="glass-card" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
      <div style={{ fontSize: '24px', marginBottom: '12px' }}>🎯</div>
      <div style={{ fontSize: '12px' }}>Awaiting Prediction Data...</div>
    </div>
  );

  const intel = (prediction.realtime_signals && prediction.realtime_signals.intelligence) 
    ? prediction.realtime_signals.intelligence 
    : { demand_factor: 1.0, supply_index: 1.0, market_pressure: "Stable" };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* ── Primary Prediction Result Card ── */}
      <div 
        className="glass-card" 
        style={{ 
          background: 'var(--bg-panel)', 
          padding: '24px',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: 600, 
              color: 'var(--text-secondary)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em'
            }}>
              Predicted Fare
            </div>
            <div style={{ 
              fontSize: '36px', 
              fontWeight: 700, 
              marginTop: '4px', 
              color: 'var(--text-primary)'
            }}>
              ₹{ Number(prediction.predicted_price || 0).toFixed(2) }
            </div>
          </div>
          <div style={{ 
            background: 'var(--accent)', 
            padding: '6px 12px', 
            fontSize: '12px', 
            fontWeight: 700,
            color: '#fff',
            borderRadius: '4px'
          }}>
            { Number(prediction.surge_multiplier || 1.0).toFixed(2) }x Surge
          </div>
        </div>
        
        <div style={{ 
          marginTop: '20px', 
          paddingTop: '16px', 
          borderTop: '1px solid var(--border-color)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          <div>
            Strategy: <span style={{ color: 'var(--text-primary)' }}>{prediction.active_strategy || 'Balanced'}</span>
          </div>
          <div>
            Revenue Impact: <span style={{ color: 'var(--accent-success)' }}>+₹{ Math.round(Number(prediction.projected_revenue || 0)) }</span>
          </div>
        </div>
      </div>
      <div className="glass-card" style={{ padding: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>System Insights</span>
          <span style={{ fontSize: '10px', color: 'var(--accent-success)', fontWeight: 700 }}>LIVE DATA</span>
        </div>

        {/* Section: Market Intelligence */}
        <div style={{ padding: '16px' }}>
          <h4 style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>Market Conditions</h4>
          <PropertyRow label="Demand Factor" value={`${intel.demand_factor}x`} color="var(--accent)" isBold />
          <PropertyRow label="Supply Index" value={intel.supply_index} color="var(--accent-success)" />
          <PropertyRow label="Forecast" value={prediction.future_demand_trend || "Steady"} />
          <PropertyRow label="Market Pressure" value={intel.market_pressure || "Stable"} color={intel.market_pressure === 'High' ? 'var(--accent-danger)' : 'var(--accent-success)'} />
        </div>

        {/* Section: Route Dynamics */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>Route Details</h4>
          <PropertyRow label="Distance" value={`${prediction.distance_km || 0} km`} />
          <PropertyRow label="Travel Time" value={`${prediction.ride_duration || 0} min`} />
          <PropertyRow label="Congestion" value={`${((prediction.realtime_signals?.traffic?.congestion_level ?? 0) * 100).toFixed(0)}%`} />
        </div>

        {/* Section: Vehicle Tiers */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>Tier Rates</h4>
          {prediction.tier_prices && Object.entries(prediction.tier_prices).map(([tier, price]) => (
            <div key={tier} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tier}</span>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>₹{ (price || 0).toFixed(2) }</span>
            </div>
          ))}
        </div>

        {/* Feedback Section */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button 
            className="glow-btn"
            onClick={() => setShowFeedback(!showFeedback)}
            style={{
              fontSize: '12px',
              padding: '10px',
              width: '100%',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '4px'
            }}
          >
            {showFeedback ? 'Hide Stats' : 'Verify Accuracy'}
          </button>
        </div>

        {showFeedback && (
          <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.05)' }}>
            <FeedbackForm 
              predictionId={prediction.prediction_id} 
              predictedPrice={prediction.predicted_price}
              onComplete={() => setShowFeedback(false)}
            />
          </div>
        )}
      </div>

      <div className="glass-card" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🧠</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>AI Reasoner Explanation</span>
          </div>
          <VoiceAssistant 
            summaryEn={prediction.voice_summary_en} 
            summaryHi={prediction.voice_summary_hi} 
          />
        </div>
        <div style={{ padding: '16px', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          {prediction.ai_explanation || "Analyzing market conditions..."}
        </div>
      </div>

      {prediction.surge_multiplier > 1.2 && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-danger)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-danger)', fontWeight: 600, fontSize: '13px' }}>
            <span>⚠️</span> Active Surge Pricing
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Market demand is currently exceeding supply. Prices adjusted for balance.
          </p>
        </div>
      )}

    </div>
  );
}

export default PricingCards;