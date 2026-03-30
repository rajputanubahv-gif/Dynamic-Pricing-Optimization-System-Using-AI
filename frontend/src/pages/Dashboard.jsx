import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import PredictionForm from "../components/PredictionForm";
import PredictionHistory from "../components/PredictionHistory";
import PricingCards from "../components/PricingCards";
import LiveHeatmap from "../components/LiveHeatmap";
import AnalyticsTab from "../components/AnalyticsTab";
import SystemSettings from "../components/SystemSettings";
import CompetitorPricing from "../components/CompetitorPricing";

function Dashboard(){

  const [activeTab, setActiveTab] = useState("pricing");
  const [prediction,setPrediction] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [systemSettings, setSystemSettings] = useState({
    baseFareRider: 5.0,
    perMileRate: 1.5,
    surgeSensitivity: 1.2
  });

  return(
    <div className="animate-in" style={{ padding: '2rem 0' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--accent-hover)' }}>
        Dynamic Pricing System
      </h1>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
        <button 
          onClick={() => setActiveTab("pricing")}
          style={{ 
            padding: '0.75rem 2rem', 
            borderRadius: '24px', 
            border: 'none',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            backgroundColor: activeTab === "pricing" ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
            color: activeTab === "pricing" ? '#fff' : 'var(--text-secondary)',
            transition: 'all 0.3s ease'
          }}
        >
          Engine Control
        </button>
        <button 
          onClick={() => setActiveTab("analytics")}
          style={{ 
            padding: '0.75rem 2rem', 
            borderRadius: '24px', 
            border: 'none',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            backgroundColor: activeTab === "analytics" ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
            color: activeTab === "analytics" ? '#fff' : 'var(--text-secondary)',
            transition: 'all 0.3s ease'
          }}
        >
          A/B Analytics
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'pricing' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeTab === 'pricing' ? 20 : -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "pricing" ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '2rem' }}>
                <PredictionForm setPrediction={setPrediction} setRefreshTrigger={setRefreshTrigger} systemSettings={systemSettings}/>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <PricingCards prediction={prediction}/>
                  <CompetitorPricing ourPrice={prediction?.predicted_price}/>
                </div>
              </div>

              {prediction && (
                <LiveHeatmap riders={prediction.rider_demand} drivers={prediction.driver_availability} city={prediction.city} />
              )}

              <PredictionHistory refreshTrigger={refreshTrigger}/>
            </>
          ) : (
            <AnalyticsTab />
          )}
        </motion.div>
      </AnimatePresence>
      <SystemSettings onSettingsChange={setSystemSettings} />
    </div>
  )
}

export default Dashboard;