import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';

function SystemSettings({ onConfigUpdate }) {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await API.get('/config');
      setSettings(res.data);
    } catch (err) {
      console.error("Failed to fetch config:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await API.patch('/config', settings);
      setSaveStatus("Success! Configuration synced.");
      if (onConfigUpdate) onConfigUpdate();
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus("Error saving configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : (type === 'number' || type === 'range' ? parseFloat(value) : value);
    setSettings(prev => ({ ...prev, [name]: val }));
  };

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>Initialising Engine...</div>;

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {children}
      </div>
    </div>
  );

  const SettingRow = ({ label, description, children }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{label}</div>
        {description && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '400px' }}>{description}</div>}
      </div>
      <div style={{ marginLeft: '24px' }}>
        {children}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '0 24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0' }}>System Configuration</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Enterprise-grade controls for the Nexus Pro Engine.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <AnimatePresence>
            {saveStatus && (
              <motion.span 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                style={{ fontSize: '12px', color: saveStatus.includes("Error") ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}
              >
                {saveStatus}
              </motion.span>
            )}
          </AnimatePresence>
          <button 
            className="glow-btn" 
            onClick={handleSave}
            disabled={isSaving}
            style={{ width: 'auto', padding: '8px 20px', fontSize: '12px' }}
          >
            {isSaving ? "Syncing..." : "Push to Engine"}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '48px' }}>
        <div>
          <Section title="Tiered Pricing Strategy">
            <SettingRow label="Base Fare (₹)" description="Global minimum start price.">
              <input type="number" name="base_fare" value={settings.base_fare} onChange={handleChange} className="settings-input" />
            </SettingRow>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <label className="settings-label">ECONOMY (₹/KM)</label>
                <input type="number" name="per_km_economy" value={settings.per_km_economy} onChange={handleChange} className="settings-input" />
              </div>
              <div>
                <label className="settings-label">PREMIUM (₹/KM)</label>
                <input type="number" name="per_km_premium" value={settings.per_km_premium} onChange={handleChange} className="settings-input" />
              </div>
              <div>
                <label className="settings-label">XL / LUX (₹/KM)</label>
                <input type="number" name="per_km_xl" value={settings.per_km_xl} onChange={handleChange} className="settings-input" />
              </div>
            </div>
          </Section>

          <Section title="Intelligence & Sensitivity">
            <SettingRow label="Surge Responsiveness" description="How aggressively the engine reacts to market pressure.">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="range" name="surge_sensitivity" min="1.0" max="3.0" step="0.1" value={settings.surge_sensitivity} onChange={handleChange} style={{ width: '120px' }} />
                <span className="monospace" style={{ fontSize: '12px', fontWeight: 700 }}>{settings.surge_sensitivity}x</span>
              </div>
            </SettingRow>
            <SettingRow label="Sustainability Reward (₹)" description="Discount for EV transitions.">
              <input type="number" name="ev_discount" value={settings.ev_discount} onChange={handleChange} className="settings-input" style={{ color: 'var(--success)' }} />
            </SettingRow>
            <SettingRow label="Carbon Surcharge (₹)" description="Levy for non-EV rides during peak pollution.">
              <input type="number" name="carbon_surcharge" value={settings.carbon_surcharge} onChange={handleChange} className="settings-input" style={{ color: 'var(--danger)' }} />
            </SettingRow>
          </Section>

          <Section title="Demand Forecasting (Time Matrix)">
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '-8px', marginBottom: '16px' }}>
              Multipliers applied to baseline rider demand based on booking period.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label className="settings-label">MORNING RUSH</label>
                <input type="number" step="0.1" name="morning_multiplier" value={settings.morning_multiplier} onChange={handleChange} className="settings-input" />
              </div>
              <div>
                <label className="settings-label">MIDDAY</label>
                <input type="number" step="0.1" name="midday_multiplier" value={settings.midday_multiplier} onChange={handleChange} className="settings-input" />
              </div>
              <div>
                <label className="settings-label">EVENING RUSH</label>
                <input type="number" step="0.1" name="evening_multiplier" value={settings.evening_multiplier} onChange={handleChange} className="settings-input" />
              </div>
              <div>
                <label className="settings-label">LATE NIGHT</label>
                <input type="number" step="0.1" name="night_multiplier" value={settings.night_multiplier} onChange={handleChange} className="settings-input" />
              </div>
            </div>
          </Section>

          <Section title="Data Source Integration">
            <SettingRow label="Real-time Traffic (TomTom)" description="Factor live congestion into multipliers.">
              <input type="checkbox" name="use_live_traffic" checked={settings.use_live_traffic} onChange={handleChange} className="nexus-toggle" />
            </SettingRow>
            <SettingRow label="Weather Dynamics (OpenWeather)" description="Adjust price for rain/heat index.">
              <input type="checkbox" name="use_weather_impact" checked={settings.use_weather_impact} onChange={handleChange} className="nexus-toggle" />
            </SettingRow>
            <SettingRow label="Social Sentiment (Beta)" description="Scan for viral trends/events.">
              <input type="checkbox" name="use_social_buzz" checked={settings.use_social_buzz} onChange={handleChange} className="nexus-toggle" />
            </SettingRow>
            <SettingRow label="Dynamic Base Fare" description="Adjust base fare automatically based on fuel index.">
              <input type="checkbox" name="use_dynamic_base_fare" checked={settings.use_dynamic_base_fare} onChange={handleChange} className="nexus-toggle" />
            </SettingRow>
            <SettingRow label="Dynamic Multiplier Scaling" description="Amplify sensitivity during extreme market pressure.">
              <input type="checkbox" name="use_dynamic_multiplier" checked={settings.use_dynamic_multiplier} onChange={handleChange} className="nexus-toggle" />
            </SettingRow>
          </Section>
          
          <Section title="Automation & ML Engine">
            <SettingRow label="Auto-Retrain Milestone" description="Retrain model after every N user feedbacks.">
              <input type="number" name="auto_retrain_threshold" value={settings.auto_retrain_threshold} onChange={handleChange} className="settings-input" />
            </SettingRow>
          </Section>
        </div>

        <div>
          <div className="glass-card" style={{ position: 'sticky', top: '24px' }}>
            <h3 style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '16px', textTransform: 'uppercase' }}>Operational Strategy</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Revenue Max', 'Balanced', 'Volume Push'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setSettings({ ...settings, strategy: mode })}
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    borderRadius: 'var(--radius-sm)',
                    background: settings.strategy === mode ? 'var(--accent)' : 'var(--bg-panel)',
                    color: settings.strategy === mode ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
            
            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase' }}>Engine Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '12px', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 8px currentColor' }} />
                Operational
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Last synced: {settings.updated_at ? new Date(settings.updated_at).toLocaleTimeString() : 'Never'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .settings-input {
          width: 80px;
          padding: 8px;
          background: var(--bg-input);
          border: 1px solid var(--border-strong);
          color: #fff;
          border-radius: 4px;
          font-family: monospace;
          font-size: 13px;
        }
        .settings-label {
          display: block;
          font-size: 9px;
          color: var(--text-tertiary);
          margin-bottom: 6px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .nexus-toggle {
          width: 36px;
          height: 18px;
          cursor: pointer;
        }
      `}</style>
    </motion.div>
  );
}

export default SystemSettings;
