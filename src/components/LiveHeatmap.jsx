import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon paths in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const riderIcon = L.divIcon({
  className: 'minimal-marker rider-marker',
  html: '<div style="width: 12px; height: 12px; border-radius: 50%; background: #ef4444; border: 2px solid white; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const driverIcon = L.divIcon({
  className: 'minimal-marker driver-marker',
  html: '<div style="width: 12px; height: 12px; border-radius: 50%; background: #0ea5e9; border: 2px solid white; box-shadow: 0 0 10px rgba(14, 165, 233, 0.5)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

function LiveHeatmap({ riders, drivers, city, coordinates, onRefresh }) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Use dynamic coordinates from the signal if provided and valid, otherwise fallback to Mumbai
  const center = (coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lon === 'number' && !isNaN(coordinates.lat) && !isNaN(coordinates.lon)) 
    ? [coordinates.lat, coordinates.lon] 
    : [19.0760, 72.8777];
  
  console.log(`[Heatmap] City: ${city}, Center: ${center}, Riders: ${riders}, Drivers: ${drivers}`);
  
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
    const rCount = Math.max(0, parseInt(riders) || 0);
    const dCount = Math.max(0, parseInt(drivers) || 0);
    console.log(`[Heatmap] Generating ${rCount} riders and ${dCount} drivers`);
    setRiderPoints(generatePoints(rCount, 'rider'));
    setDriverPoints(generatePoints(dCount, 'driver'));
  }, [riders, drivers, city, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    if (onRefresh) onRefresh();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card" 
      style={{ marginBottom: '2rem', padding: '0', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ padding: '16px 24px', background: 'rgba(14, 165, 233, 0.05)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ 
            margin: 0, 
            color: 'var(--text-primary)', 
            fontSize: '14px',
            fontWeight: 600
          }}>
            Live Market Map - {city}
          </h3>
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></span> Riders
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0ea5e9' }}></span> Drivers
            </span>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', height: '440px', width: '100%' }}>
        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1000 }}>
          <button 
            className="glow-btn"
            onClick={handleRefresh}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: '4px',
              width: 'auto'
            }}
          >
            Refresh Map
          </button>
        </div>

        <MapContainer key={center.join(',')} center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {driverPoints.map(point => (
            <Marker key={point.id} position={point.position} icon={driverIcon}>
              <Tooltip direction="top" offset={[0, -10]}>
                <div style={{ padding: '4px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent)' }}>Driver Available</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Rating: ★ {point.rating}</div>
                </div>
              </Tooltip>
            </Marker>
          ))}

          {riderPoints.map(point => (
            <Marker key={point.id} position={point.position} icon={riderIcon}>
              <Tooltip direction="top" offset={[0, -10]}>
                <div style={{ padding: '4px' }}>
                  <div style={{ fontWeight: 600, color: '#ef4444' }}>Rider Request</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ETA: {point.eta} min</div>
                </div>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </motion.div>
  );
}

export default LiveHeatmap;
