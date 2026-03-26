import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api";

function PredictionForm({setPrediction, setRefreshTrigger, onCityChange}){

  const [riders,setRiders] = useState(120);
  const [drivers,setDrivers] = useState(40);
  const [origin, setOrigin] = useState("Bandra");
  const [destination, setDestination] = useState("Andheri");
  const [loyalty,setLoyalty] = useState(1);
  const [timeCategory, setTimeCategory] = useState(2);
  const [weatherCategory, setWeatherCategory] = useState("Auto");
  const [city, setCity] = useState("Mumbai");
  const [vehicleType, setVehicleType] = useState(0); // 0: Economy, 1: Premium, 2: XL, 3: EV
  const [isLoading, setIsLoading] = useState(false);

  const predict = async ()=>{
    setIsLoading(true);
    // Pre-flight validation
    const r = parseInt(riders) || 120;
    const d = parseInt(drivers) || 40;
    const l = parseInt(loyalty) || 1;
    const t = parseInt(timeCategory) || 2;
    const v = parseInt(vehicleType) || 0;

    const data = {
      Number_of_Riders: r,
      Number_of_Drivers: d,
      Location_Category: 2,
      Customer_Loyalty_Status: l,
      Number_of_Past_Rides: 50,
      Average_Ratings: 4.5,
      Time_of_Booking: t,
      Vehicle_Type: v,
      Expected_Ride_Duration: 0, // Placeholder, backend will calculate from route
      Origin: origin || "Default",
      Destination: destination || "Default",
      Demand_Supply_Ratio: d > 0 ? r/d : r,
      Ride_Duration_Category: 1,
      Demand_Level: 2,
      Driver_Availability: d,
      Weather_Condition: weatherCategory,
      City: city || "Mumbai"
    }

    console.log("NEXUS ENGINE: Dispatching Request...", data);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 600)); 
      
      const res = await API.post("/predict", data);
      
      if (res.data) {
        setPrediction(res.data);
        if(setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
      } else {
        console.error("Nexus Engine: Response received but data is empty.");
      }
    } catch (err) {
      console.error("NEXUS ENGINE: CRITICAL ERROR", err);
    } finally {
      setIsLoading(false);
    }
  }

  const labelStyle = { fontSize: '10px', fontWeight: '700', color: 'var(--text-tertiary)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' };
  
  const vehicleOptions = [
    { id: 0, label: 'Economy', icon: '🚗' },
    { id: 1, label: 'Premium', icon: '✨' },
    { id: 2, label: 'Nexus XL', icon: '🚐' },
    { id: 3, label: 'Nexus EV', icon: '🌿' },
  ];

  return(
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{ padding: '24px' }}
    >
      <div style={{ marginBottom: '32px', borderBottom: '1px solid var(--accent-muted)', paddingBottom: '16px' }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '18px', 
          fontWeight: 900, 
          fontFamily: 'var(--font-header)',
          color: 'var(--accent)',
          textShadow: '0 0 10px var(--accent-glow)',
          textTransform: 'uppercase'
        }}>
          ENGINE_PARAMETERS
        </h3>
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>// CONFIGURING_NEURAL_SESS_V2.0</p>
      </div>
      
      {/* Vehicle Type Switcher */}
      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Tier selection</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {vehicleOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setVehicleType(option.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-header)',
                border: vehicleType === option.id ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                background: vehicleType === option.id ? 'var(--accent-muted)' : 'var(--bg-panel)',
                color: vehicleType === option.id ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                boxShadow: vehicleType === option.id ? '0 0 10px var(--accent-glow)' : 'none'
              }}
            >
              <span>{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Riders</label>
          <input type="number" value={riders} onChange={(e)=>setRiders(e.target.value)} style={{ margin: 0, padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', color: '#fff', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}/>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Drivers</label>
          <input type="number" value={drivers} onChange={(e)=>setDrivers(e.target.value)} style={{ margin: 0, padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', color: '#fff', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}/>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Pickup</label>
          <input type="text" value={origin} onChange={(e)=>setOrigin(e.target.value)} style={{ margin: 0, padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', color: '#fff', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}/>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Dropoff</label>
          <input type="text" value={destination} onChange={(e)=>setDestination(e.target.value)} style={{ margin: 0, padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', color: '#fff', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}/>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Loyalty (0-3)</label>
          <input type="number" value={loyalty} max="3" min="0" onChange={(e)=>setLoyalty(e.target.value)} style={{ margin: 0, padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', color: '#fff', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}/>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Period</label>
          <select value={timeCategory} onChange={(e) => setTimeCategory(e.target.value)} style={{ margin: 0, padding: '10px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-strong)', color: '#fff', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}>
            <option value={0}>Morning Rush</option>
            <option value={1}>Midday</option>
            <option value={2}>Evening Rush</option>
            <option value={3}>Late Night</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Weather</label>
          <select value={weatherCategory} onChange={(e) => setWeatherCategory(e.target.value)} style={{ margin: 0, padding: '10px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-strong)', color: '#fff', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}>
            <option value="Auto">Auto (Live)</option>
            <option value="Clear">Manual: Clear</option>
            <option value="Rain">Manual: Rain</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Regional City</label>
          <input 
            type="text" 
            value={city} 
            onChange={(e) => { setCity(e.target.value); onCityChange && onCityChange(e.target.value); }} 
            style={{ margin: 0, padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', color: '#fff', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <motion.button 
        whileTap={{ scale: 0.98 }}
        className="glow-btn" 
        onClick={predict}
        disabled={isLoading}
        style={{ 
          opacity: isLoading ? 0.6 : 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '8px',
          height: '48px',
          width: '100%',
          fontSize: '14px',
          fontWeight: 800,
          background: 'var(--accent)',
          border: 'none',
          color: '#000',
          cursor: 'pointer'
        }}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <div className="spinner" />
              Syncing with Nexus...
            </motion.div>
          ) : (
            <motion.span
              key="text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Calculate Live Price
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      
      <style>{`
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          borderRadius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  )
}

export default PredictionForm;