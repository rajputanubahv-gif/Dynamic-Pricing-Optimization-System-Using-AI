import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api";

function PredictionForm({setPrediction, setRefreshTrigger, systemSettings}){

  const [riders,setRiders] = useState(120);
  const [drivers,setDrivers] = useState(40);
  const [duration,setDuration] = useState(30);
  const [loyalty,setLoyalty] = useState(1);
  const [timeCategory, setTimeCategory] = useState(2);
  const [weatherCategory, setWeatherCategory] = useState("Clear");
  const [city, setCity] = useState("Mumbai");
  const [isLoading, setIsLoading] = useState(false);

  const predict = async ()=>{
    setIsLoading(true);
    
    const data = {
      Number_of_Riders:parseInt(riders),
      Number_of_Drivers:parseInt(drivers),
      Location_Category:2,
      Customer_Loyalty_Status:parseInt(loyalty),
      Number_of_Past_Rides:50,
      Average_Ratings:4.5,
      Time_of_Booking:parseInt(timeCategory),
      Vehicle_Type:1,
      Expected_Ride_Duration:parseInt(duration),
      Demand_Supply_Ratio:riders/drivers,
      Ride_Duration_Category:1,
      Demand_Level:2,
      Driver_Availability:parseInt(drivers),
      Weather_Condition: weatherCategory,
      City: city,
      baseFareRider: systemSettings?.baseFareRider || 5.0,
      perMileRate: systemSettings?.perMileRate || 1.5,
      surgeSensitivity: systemSettings?.surgeSensitivity || 1.2
    }

    try {
      // Small artificial delay to show off the loading animation elegantly
      await new Promise(resolve => setTimeout(resolve, 600));
      const res = await API.post("/predict",data);
      setPrediction(res.data);
      if(setRefreshTrigger) setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Prediction failed:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return(
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card"
    >
      <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
        Engine Parameters
      </h3>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🚶</span> Active Riders
          </label>
          <input type="number" value={riders} onChange={(e)=>setRiders(e.target.value)} style={{ marginBottom: 0 }}/>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🚗</span> Available Drivers
          </label>
          <input type="number" value={drivers} onChange={(e)=>setDrivers(e.target.value)} style={{ marginBottom: 0 }}/>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⏱️</span> Ride Duration (mins)
          </label>
          <input type="number" value={duration} onChange={(e)=>setDuration(e.target.value)} style={{ marginBottom: 0 }}/>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⭐</span> Loyalty Tier (0-3)
          </label>
          <input type="number" value={loyalty} max="3" min="0" onChange={(e)=>setLoyalty(e.target.value)} style={{ marginBottom: 0 }}/>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🕒</span> Time of Booking
          </label>
          <select value={timeCategory} onChange={(e) => setTimeCategory(e.target.value)} style={{ marginBottom: 0 }}>
            <option value={0}>Morning Rush (Drop)</option>
            <option value={1}>Midday (Rising)</option>
            <option value={2}>Evening Rush (Steady)</option>
            <option value={3}>Late Night (Crash)</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🌤️</span> Simulated Weather
          </label>
          <select value={weatherCategory} onChange={(e) => setWeatherCategory(e.target.value)} style={{ marginBottom: 0 }}>
            <option value="Clear">Clear / Normal</option>
            <option value="Rain">Heavy Rain</option>
            <option value="Storm">Severe Storm / Snow</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🏙️</span> City (Heatmap Location)
          </label>
          <select value={city} onChange={(e) => setCity(e.target.value)} style={{ marginBottom: 0 }}>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Chennai">Chennai</option>
          </select>
        </div>
      </div>

      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="glow-btn" 
        onClick={predict}
        disabled={isLoading}
        style={{ 
          opacity: isLoading ? 0.7 : 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '0.75rem',
          height: '52px'
        }}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <div className="spinner" style={{ 
                width: '20px', height: '20px', 
                border: '3px solid rgba(255,255,255,0.3)', 
                borderTopColor: '#fff', 
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Processing Model...
            </motion.div>
          ) : (
            <motion.span
              key="text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Calculate Dynamic Price
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  )
}

export default PredictionForm;