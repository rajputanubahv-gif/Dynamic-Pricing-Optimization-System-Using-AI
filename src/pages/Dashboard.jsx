import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PredictionForm from '../components/PredictionForm';
import PricingCards from '../components/PricingCards';
import LiveSignalsPanel from '../components/LiveSignalsPanel';
import PredictionHistory from '../components/PredictionHistory';
import AnalyticsTab from '../components/AnalyticsTab';
import SystemSettings from '../components/SystemSettings';
import CompetitorPricing from '../components/CompetitorPricing';
import LiveHeatmap from '../components/LiveHeatmap';
import API from '../api';

function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pricing');
  const [prediction, setPrediction] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [systemConfig, setSystemConfig] = useState(null);
  const [liveSignals, setLiveSignals] = useState(null);
  const [user, setUser] = useState(null);
  
    useEffect(() => {
      fetchUser();
      fetchGlobalConfig();
      refreshLiveSignals();
    }, [selectedCity]);

    const fetchUser = async () => {
      try {
        const res = await API.get('/me');
        setUser(res.data);
      } catch (err) {
        console.error("Failed to load user info:", err);
      }
    };

    const fetchGlobalConfig = async () => {
      try {
        const res = await API.get('/config');
        setSystemConfig(res.data);
      } catch (err) {
        console.error("Failed to load global config:", err);
      }
    };
  
    const refreshLiveSignals = async () => {
      try {
        const res = await API.get(`/realtime-signals?city=${selectedCity}`);
        setLiveSignals(res.data);
      } catch (err) {
        console.error("Radar Sync Failure:", err);
      }
    };

  const navItems = [
    { id: 'pricing', label: 'Engine', icon: '🎯' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'history', label: 'Logs', icon: '📜' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="app-shell">
      
      {/* ── Sidebar (App Nav) ── */}
      <nav className="app-nav">
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
          <div style={{ 
            fontFamily: 'var(--font-header)', 
            fontSize: '16px', 
            fontWeight: 700, 
            letterSpacing: '1px',
            color: 'var(--accent)'
          }}>
            NEXUS <span style={{ color: 'var(--text-primary)' }}>PORTAL</span>
          </div>
        </div>

        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </div>
        ))}

        <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              background: 'var(--bg-panel)', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--accent)',
              border: '1px solid var(--border-color)'
            }}>
              {user?.username ? user.username[0].toUpperCase() : '?'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user?.username || 'Guest Agent'}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: 'var(--text-secondary)'
              }}>
                {user?.is_verified ? 'Verified' : 'Pending'}
              </div>
            </div>
          </div>
          
          <button 
            className="glow-btn"
            onClick={() => { localStorage.removeItem("token"); navigate("/"); }}
            style={{ 
              padding: '8px', 
              fontSize: '12px', 
              width: '100%',
              background: 'transparent',
              border: '1px solid var(--accent-danger)',
              color: 'var(--accent-danger)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ── Main Content Area ── */}
      <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* App Header */}
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              fontSize: '11px', 
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase'
            }}>
              SYSTEM / <span style={{ color: 'var(--accent)' }}>{selectedCity}</span> / {navItems.find(i => i.id === activeTab)?.label}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--accent)', 
              fontWeight: 600
            }}>
              System Online
            </div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-success)' }} />
          </div>
        </header>

        {/* Scrollable Container */}
        <div className="scrollable-pane">
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div className="tab-pane-content" key={activeTab}>
                {activeTab === 'pricing' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <LiveSignalsPanel city={selectedCity} />
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: '32px', 
                      alignItems: 'start',
                      overflowX: 'auto',
                      paddingBottom: '20px'
                    }}>
                      
                      {/* Parameters Column */}
                      <div style={{ width: '360px', flexShrink: 0 }}>
                        <PredictionForm 
                          setPrediction={setPrediction} 
                          setRefreshTrigger={setRefreshTrigger} 
                          onCityChange={setSelectedCity}
                        />
                      </div>
                      
                      {/* Results Column */}
                      <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {prediction ? (
                          <>
                            <PricingCards prediction={prediction} />
                            <CompetitorPricing prediction={prediction} />
                            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                              <LiveHeatmap 
                                riders={prediction?.rider_demand || 100} 
                                drivers={prediction?.driver_availability || 40} 
                                city={prediction?.city || selectedCity} 
                                coordinates={prediction?.realtime_signals?.coordinates}
                                onRefresh={refreshLiveSignals}
                              />
                            </div>
                          </>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="glass-card" style={{ 
                              padding: '60px 40px', 
                              textAlign: 'center', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '16px',
                              background: 'rgba(255,255,255,0.02)',
                              borderStyle: 'dashed',
                              color: 'var(--text-tertiary)'
                            }}>
                              <div style={{ fontSize: '48px' }}>🎯</div>
                              <div>
                                <h3 style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Awaiting Session Data</h3>
                                <p style={{ fontSize: '12px' }}>Fill in parameters and click 'Calculate Price' to begin.</p>
                              </div>
                            </div>
                            
                            {/* Always show city heatmap even if no prediction */}
                            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                              <LiveHeatmap 
                                riders={liveSignals?.intelligence?.demand_factor ? liveSignals.intelligence.demand_factor * 80 : 100} 
                                drivers={liveSignals?.intelligence?.supply_index ? liveSignals.intelligence.supply_index * 60 : 40} 
                                city={selectedCity} 
                                coordinates={liveSignals?.coordinates}
                                onRefresh={refreshLiveSignals}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: '24px' }}>
                      <PredictionHistory refreshTrigger={refreshTrigger} />
                    </div>
                  </div>
                )}

                {activeTab === 'analytics' && <AnalyticsTab />}
                
                {activeTab === 'history' && (
                  <PredictionHistory refreshTrigger={refreshTrigger} />
                )}

                {activeTab === 'settings' && <SystemSettings onConfigUpdate={fetchGlobalConfig} />}
              </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default Dashboard;