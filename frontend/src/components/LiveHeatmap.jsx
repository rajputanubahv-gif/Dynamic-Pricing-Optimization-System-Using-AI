import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon paths in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow
});
L.Marker.prototype.options.icon = DefaultIcon;

function LiveHeatmap({ riders, drivers, city }) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Dictionary of dynamic city coordinates
  const cityCoordinates = {
    "Mumbai": [19.0760, 72.8777],
    "Delhi": [28.6139, 77.2090],
    "Bangalore": [12.9716, 77.5946],
    "Chennai": [13.0827, 80.2707]
  };
  
  // Default to Mumbai if missing
  const center = cityCoordinates[city] || cityCoordinates["Mumbai"];
  
  // Generate random clustered points around the center for visual effect
  // Depending on the refresh key to generate NEW points when clicked
  const generatePoints = (count, clusterType) => {
    // We use the refreshKey in the seed strategy implicitly by letting it trigger a re-render
    return Array.from({ length: Math.min(count, 300) }).map((_, i) => {
      const latOffset = (Math.random() - 0.5) * (clusterType === 'rider' ? 0.04 : 0.08);
      const lngOffset = (Math.random() - 0.5) * (clusterType === 'rider' ? 0.06 : 0.1);
      
      // Simulate some fake metadata for the tooltips
      const eta = Math.floor(Math.random() * 10) + 1;
      const rating = (Math.random() * (5.0 - 4.2) + 4.2).toFixed(1);
      
      return {
        id: `${clusterType}-${refreshKey}-${i}`,
        position: [center[0] + latOffset, center[1] + lngOffset],
        type: clusterType,
        rating: rating,
        eta: eta
      };
    });
  };

  const [riderPoints, setRiderPoints] = useState([]);
  const [driverPoints, setDriverPoints] = useState([]);

  useEffect(() => {
    setRiderPoints(generatePoints(riders || 0, 'rider'));
    setDriverPoints(generatePoints(drivers || 0, 'driver'));
  }, [riders, drivers, city, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem', position: 'relative' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
          🗺️ Live Supply & Demand Map
        </h3>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }}></span> Riders
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#3b82f6' }}></span> Drivers
          </span>
        </div>
      </div>

      <div style={{ position: 'relative', height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        
        {/* Interactive Floating Control Panel */}
        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              padding: '8px 16px',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }}></span>
            Live Radar Refresh
          </motion.button>
        </div>

        {/* The key prop forces the MapContainer to completely rerender when the center changes */}
        <MapContainer key={center.join(',')} center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {/* Render Drivers (Blue) */}
          {driverPoints.map(point => (
            <CircleMarker 
              key={point.id} 
              center={point.position} 
              radius={5}
              fillColor="#3b82f6"
              color="#2563eb"
              weight={1}
              fillOpacity={0.6}
            >
              <Tooltip className="custom-leaflet-tooltip" direction="top" offset={[0, -10]} opacity={1}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', color: '#60a5fa', marginBottom: '4px' }}>Available Driver</div>
                  <div style={{ color: 'var(--text-secondary)' }}>★ {point.rating}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Status: Waiting</div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

          {/* Render Riders (Red) */}
          {riderPoints.map(point => (
            <CircleMarker 
              key={point.id} 
              center={point.position} 
              radius={8}
              fillColor="#ef4444"
              color="#dc2626"
              weight={1}
              fillOpacity={0.4}
            >
              <Tooltip className="custom-leaflet-tooltip" direction="top" offset={[0, -10]} opacity={1}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', color: '#f87171', marginBottom: '4px' }}>Rider Request</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Tier: Economy</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Wait Time: {point.eta} min</div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </motion.div>
  );
}

export default LiveHeatmap;
