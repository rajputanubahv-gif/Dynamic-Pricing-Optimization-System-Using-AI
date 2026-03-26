import { useState, useEffect, useRef } from 'react';
import API from '../api';

function LiveSignalsPanel({ city }) {
  const [signals, setSignals] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef(null);

  const fetchSignals = async () => {
    try {
      const res = await API.get(`/realtime-signals?city=${city || 'Mumbai'}`);
      setSignals(res.data);
      setLastUpdated(new Date());
      setIsLive(true);
    } catch (err) {
      console.error("Failed to fetch real-time signals:", err);
      setIsLive(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    intervalRef.current = setInterval(fetchSignals, 30000); // Poll every 30s
    return () => clearInterval(intervalRef.current);
  }, [city]);

  const formatTime = (d) => {
    if (!d) return '--:--';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const weatherIcon = (condition) => {
    if (condition === 'Storm') return '⛈️';
    if (condition === 'Rain') return '🌧️';
    return '☀️';
  };

  const congestionColor = (level) => {
    if (level > 0.7) return 'var(--danger)';
    if (level > 0.4) return 'var(--warning)';
    return 'var(--success)';
  };

  const signalBadge = { 
    display: 'inline-flex', 
    alignItems: 'center', 
    gap: '6px', 
    padding: '4px 10px', 
    borderRadius: '100px', 
    fontSize: '11px', 
    fontWeight: '500',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
    boxShadow: 'var(--inner-border)',
    transition: 'all 0.15s ease'
  };

  return (
    <div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'transparent',
        padding: '8px 0',
        marginBottom: '12px'
      }}
    >
      {/* Header - Floating Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '6px', height: '6px', borderRadius: '50%', 
            background: isLive ? 'var(--success)' : 'var(--danger)',
            boxShadow: isLive ? '0 0 8px var(--success)' : 'none'
          }} />
          <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            System Status: {city || 'Mumbai'}
          </h3>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
          {isLive ? 'Live Sync Active' : 'Offline'} • {formatTime(lastUpdated)}
        </span>
      </div>

      {!signals ? (
        <div style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Fetching live data...</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {/* Weather */}
          <div style={signalBadge}>
            <span>{weatherIcon(signals.weather?.condition)}</span>
            <span style={{ color: 'var(--text-primary)' }}>{signals.weather?.condition}</span>
            <span style={{ color: 'var(--text-tertiary)' }}>{signals.weather?.temp_c}°C</span>
            {signals.weather?.source === 'api' && (
              <span style={{ fontSize: '9px', color: 'var(--success)', fontWeight: 600 }}>LIVE</span>
            )}
          </div>

          {/* Traffic */}
          <div style={signalBadge}>
            <span>🚗</span>
            <span style={{ color: 'var(--text-primary)' }}>Traffic</span>
            <span style={{ 
              color: congestionColor(signals.traffic?.congestion_level),
              fontWeight: 600,
              fontSize: '11px'
            }}>
              {Math.round((signals.traffic?.congestion_level || 0) * 100)}%
            </span>
            {signals.traffic?.source === 'api' && (
              <span style={{ fontSize: '9px', color: 'var(--success)', fontWeight: 600 }}>LIVE</span>
            )}
          </div>

          {/* Events */}
          <div style={signalBadge}>
            <span>🎟️</span>
            <span style={{ color: 'var(--text-primary)' }}>Events</span>
            <span style={{ color: signals.events?.active_events > 0 ? 'var(--warning)' : 'var(--text-tertiary)' }}>
              {signals.events?.active_events || 0} active
            </span>
            {signals.events?.max_rank !== 'none' && (
              <span style={{ 
                fontSize: '9px', 
                padding: '1px 5px', 
                borderRadius: '3px',
                background: signals.events?.max_rank === 'major' ? 'rgba(242, 72, 34, 0.15)' : 'rgba(255, 184, 0, 0.15)',
                color: signals.events?.max_rank === 'major' ? 'var(--danger)' : 'var(--warning)',
                fontWeight: 600
              }}>
                {signals.events?.max_rank?.toUpperCase()}
              </span>
            )}
          </div>

          {/* Transit Status */}
          <div style={{ ...signalBadge, borderColor: signals.transit?.status.includes('Delayed') ? 'var(--danger)' : 'var(--border-color)' }}>
            <span>🚆</span>
            <span style={{ color: 'var(--text-primary)' }}>Transit</span>
            <span style={{ 
              color: signals.transit?.status.includes('Delayed') ? 'var(--danger)' : 'var(--success)',
              fontWeight: 600
            }}>
              {signals.transit?.status}
            </span>
          </div>

          {/* Fuel Price */}
          <div style={signalBadge}>
            <span>⛽</span>
            <span style={{ color: 'var(--text-primary)' }}>Petrol</span>
            <span style={{ color: 'var(--text-tertiary)' }}>₹{signals.fuel?.petrol}</span>
            <span style={{ 
              fontSize: '10px', 
              color: signals.fuel?.trend.includes('Up') ? 'var(--danger)' : 'var(--text-tertiary)' 
            }}>
              {signals.fuel?.trend}
            </span>
          </div>

          {/* Heat Index / Humidity */}
          <div style={signalBadge}>
            <span>🌡️</span>
            <span style={{ color: 'var(--text-primary)' }}>Feels Like</span>
            <span style={{ 
              color: (signals.weather?.temp_c + 0.55 * (1 - signals.weather?.humidity/100) * (signals.weather?.temp_c - 14.5)) > 38 ? 'var(--danger)' : 'var(--text-primary)',
              fontWeight: 600
            }}>
              {Math.round(signals.weather?.temp_c + 0.55 * (1 - signals.weather?.humidity/100) * (signals.weather?.temp_c - 14.5))}°C
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{signals.weather?.humidity}% RH</span>
          </div>

          {/* Holiday */}
          {signals.holiday?.is_holiday && (
            <div style={{ ...signalBadge, borderColor: 'rgba(151, 71, 255, 0.3)' }}>
              <span>🏖️</span>
              <span style={{ color: 'var(--purple)' }}>{signals.holiday.holiday_name}</span>
            </div>
          )}

          {/* ── Frontier & Ultra Alerts ── */}

          {/* Arrival Sync (ULTRA) */}
          {signals.arrival?.is_blast && (
            <div 
              className="pulse-arrival"
              style={{ ...signalBadge, borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)' }}
            >
              <span style={{ animation: 'pulse 1s infinite' }}>🚀</span>
              <span style={{ color: 'var(--danger)', fontWeight: 700 }}>ULTRA: {signals.arrival.type} Arrival</span>
              <span style={{ fontSize: '10px', color: 'var(--danger)' }}>3.0x ACTIVE</span>
            </div>
          )}

          {/* Frozen Zone (ULTRA) */}
          {signals.frozen?.is_frozen && (
            <div 
              className="shaking-alert"
              style={{ ...signalBadge, borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.2)' }}
            >
              <span>🚩</span>
              <span style={{ color: 'var(--danger)', fontWeight: 800 }}>ULTRA: FROZEN ZONE</span>
              <span style={{ fontSize: '10px', color: 'var(--danger)' }}>BLOCKADE</span>
            </div>
          )}

          {/* Predictive Ripple (FRONTIER) */}
          {signals.ripple?.has_ripple && (
            <div style={{ ...signalBadge, borderColor: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' }}>
              <span>🌊</span>
              <span style={{ color: '#a78bfa', fontWeight: 600 }}>FRONTIER: Predictive Ripple</span>
              <span style={{ fontSize: '10px', color: '#a78bfa' }}>+{Math.round((signals.ripple.intensity-1)*100)}% IN {signals.ripple.impact_time_mins}m</span>
            </div>
          )}

          {/* Social Buzz (FRONTIER) */}
          {signals.buzz?.has_buzz && (
            <div style={{ ...signalBadge, borderColor: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
              <span>📣</span>
              <span style={{ color: '#60a5fa', fontWeight: 600 }}>FRONTIER: {signals.buzz.topic}</span>
              <span style={{ fontSize: '10px', color: '#60a5fa' }}>BUZZING</span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .pulse-arrival { animation: pulse-scale 1.5s infinite; }
        .shaking-alert { animation: shake 0.1s infinite; }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); border-color: var(--danger); }
          50% { transform: scale(1.05); border-color: rgba(239,68,68,0.4); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-1px); }
          75% { transform: translateX(1px); }
        }
      `}</style>
    </div>
  );
}

export default LiveSignalsPanel;
