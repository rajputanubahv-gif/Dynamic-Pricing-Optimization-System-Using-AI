import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function SystemSettings({ onSettingsChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    baseFareRider: 5.0,
    perMileRate: 1.5,
    surgeSensitivity: 1.2,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  const handleApply = () => {
    if(onSettingsChange) onSettingsChange(settings);
    setIsOpen(false);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '1.5rem',
          zIndex: 1000
        }}
        title="System Configuration"
      >
        ⚙️
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="glass-card"
            style={{
              position: 'fixed',
              bottom: '5rem',
              right: '2rem',
              width: '320px',
              padding: '1.5rem',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Engine Parameters</h3>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                &times;
              </button>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Adjusting these will impact the next prediction calculation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Base Fare ($): {settings.baseFareRider.toFixed(2)}
              </label>
              <input 
                type="range" 
                name="baseFareRider" 
                min="2.0" 
                max="10.0" 
                step="0.5"
                value={settings.baseFareRider}
                onChange={handleChange}
                style={{ padding: 0, margin: 0 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Per Mile Rate ($): {settings.perMileRate.toFixed(2)}
              </label>
              <input 
                type="range" 
                name="perMileRate" 
                min="0.5" 
                max="3.0" 
                step="0.1"
                value={settings.perMileRate}
                onChange={handleChange}
                style={{ padding: 0, margin: 0 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Surge Sensitivity: {settings.surgeSensitivity.toFixed(2)}x
              </label>
              <input 
                type="range" 
                name="surgeSensitivity" 
                min="1.0" 
                max="3.0" 
                step="0.1"
                value={settings.surgeSensitivity}
                onChange={handleChange}
                style={{ padding: 0, margin: 0 }}
              />
            </div>

            <button className="glow-btn" onClick={handleApply} style={{ marginTop: '0.5rem', padding: '0.6rem' }}>
              Apply Settings
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default SystemSettings;
