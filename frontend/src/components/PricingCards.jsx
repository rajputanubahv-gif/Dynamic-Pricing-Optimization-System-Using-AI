import CountUp from 'react-countup';
import { motion } from 'framer-motion';

const MetricCard = ({ title, value, icon, color, isCurrency, isMultiplier, isPercentage }) => {
  // Extract just the number for counting if possible
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g,"")) : value;
  const showCountUp = !isNaN(numericValue) && typeof value !== 'string' || (typeof value === 'string' && value.match(/^[0-9]+(\.[0-9]+)?$/));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
      className="glass-card" 
      style={{ padding: '1.5rem', textAlign: 'center', borderColor: `rgba(${color}, 0.3)` }}
    >
      <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
        <span style={{ marginRight: '0.5rem' }}>{icon}</span>
        {title}
      </h3>
      <p style={{ fontSize: '1.5rem', fontWeight: '700', color: `rgb(${color})`, margin: 0 }}>
        {isCurrency && "₹"}
        {showCountUp ? (
          <CountUp end={numericValue} decimals={numericValue % 1 !== 0 ? 2 : 0} duration={2} separator="," />
        ) : (
          value
        )}
        {isMultiplier && "x"}
        {isPercentage && "%"}
      </p>
    </motion.div>
  );
};

function PricingCards({prediction}){
  if(!prediction) return null;

  const isHighSurge = prediction.surge_multiplier > 1.5;

  return(
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}
    >
      
      {/* Multi-Tier Vehicle Selection Grid */}
      {prediction.tier_prices && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', borderColor: 'rgba(59, 130, 246, 0.5)', background: 'rgba(59, 130, 246, 0.1)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>🚗 Economy</h3>
            <p style={{ fontSize: '2rem', fontWeight: '800', color: '#60a5fa', margin: 0 }}>
              ₹<CountUp end={prediction.tier_prices.Economy} decimals={2} duration={1.5} />
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1.05 }} transition={{ delay: 0.2 }}
            className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', borderColor: 'rgba(16, 185, 129, 0.5)', background: 'rgba(16, 185, 129, 0.1)', transform: 'scale(1.05)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>✨ Premium</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: '800', color: '#34d399', margin: 0 }}>
              ₹<CountUp end={prediction.tier_prices.Premium} decimals={2} duration={2} />
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', borderColor: 'rgba(217, 70, 239, 0.5)', background: 'rgba(217, 70, 239, 0.1)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>🚐 XL</h3>
            <p style={{ fontSize: '2rem', fontWeight: '800', color: '#e879f9', margin: 0 }}>
              ₹<CountUp end={prediction.tier_prices.XL} decimals={2} duration={1.5} />
            </p>
          </motion.div>
        </div>
      )}

      {/* Secondary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <MetricCard title="Actual Base Price" value={prediction.actual_price} icon="💵" color="148, 163, 184" isCurrency />
        
        {/* Special treatment for surge card */}
        <motion.div 
          animate={isHighSurge ? { boxShadow: ["0 0 0px rgba(245,158,11,0)", "0 0 20px rgba(245,158,11,0.6)", "0 0 0px rgba(245,158,11,0)"] } : {}}
          transition={isHighSurge ? { repeat: Infinity, duration: 2 } : {}}
          className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', borderColor: `rgba(245, 158, 11, 0.5)` }}
        >
          <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ marginRight: '0.5rem' }}>📈</span> Surge Multiplier
          </h3>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: `rgb(245, 158, 11)`, margin: 0 }}>
            <CountUp end={prediction.surge_multiplier} decimals={2} duration={2} />x
          </p>
        </motion.div>

        <MetricCard title="Demand Level" value={prediction.demand_level} icon="🔥" color="239, 68, 68" />
        <MetricCard title="Driver Availability" value={prediction.driver_availability} icon="🚗" color="59, 130, 246" />
        <MetricCard title="Rider Demand" value={prediction.rider_demand} icon="🚶" color="139, 92, 246" />
        <MetricCard title="Demand Supply Ratio" value={prediction.demand_supply_ratio} icon="⚖️" color="6, 182, 212" />
        <MetricCard title="Ride Duration" value={`${prediction.ride_duration} mins`} icon="⏱️" color="20, 184, 166" />
        <MetricCard title="Model Conf." value={prediction.model_confidence} icon="🎯" color="234, 179, 8" isPercentage />
        <MetricCard title="Price Elasticity" value={prediction.price_elasticity.toFixed(2)} icon="📉" color="217, 70, 239" />
        <MetricCard title="Future Trend" value={prediction.future_demand_trend} icon="🔮" color="139, 92, 246" />
        <MetricCard title="Expected Revenue" value={prediction.expected_revenue} icon="💰" color="16, 185, 129" isCurrency />
        
        {/* New Analytics Cards */}
        {prediction.optimal_strategy && (
          <>
            <MetricCard title="Optimal Strategy" value={prediction.optimal_strategy.includes("Volume") ? "Volume" : "Margin"} icon="♟️" color="99, 102, 241" />
            <MetricCard title="Expected Net Margin" value={prediction.margin_percentage} icon="📊" color="16, 185, 129" isPercentage />
            <MetricCard title="Expected Conversion" value={`${prediction.expected_bookings} rides`} icon="🤝" color="59, 130, 246" />
            <MetricCard title="Theoretical Lost Rev." value={prediction.lost_revenue} icon="💸" color="239, 68, 68" isCurrency />
          </>
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="glass-card" style={{ padding: '1.5rem', borderColor: 'rgba(99, 102, 241, 0.4)', background: 'rgba(99, 102, 241, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🧠</span>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>AI Explanation</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-line' }}>
          {prediction.ai_explanation}
        </p>
      </motion.div>

    </motion.div>
  )
}

export default PricingCards;