import React, { useState, useEffect } from 'react';
import { APIProvider, Map, MapControl, ControlPosition } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowLeft, Landmark, BarChart3, ChevronRight, AlertTriangle, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../data/translations';

const MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY || ""; 

const ELECTION_RESULTS = {
  "Andhra Pradesh": { alliance: "NDA", seats: 25, lead: "TDP", color: "var(--eci-saffron)", voter_turnout: "80.6%" },
  "Bihar": { alliance: "NDA", seats: 40, lead: "JDU/BJP", color: "var(--eci-saffron)", voter_turnout: "56.1%" },
  "Maharashtra": { alliance: "INDIA", seats: 48, lead: "SS(UBT)/INC", color: "#0052cc", voter_turnout: "61.3%" },
  "Uttar Pradesh": { alliance: "INDIA", seats: 80, lead: "SP/INC", color: "#0052cc", voter_turnout: "56.9%" },
  "Tamil Nadu": { alliance: "INDIA", seats: 39, lead: "DMK", color: "#0052cc", voter_turnout: "69.7%" },
  "West Bengal": { alliance: "INDIA", seats: 42, lead: "TMC", color: "#0052cc", voter_turnout: "79.2%" },
  "Gujarat": { alliance: "NDA", seats: 26, lead: "BJP", color: "var(--eci-saffron)", voter_turnout: "60.1%" },
  "Karnataka": { alliance: "NDA", seats: 28, lead: "BJP", color: "var(--eci-saffron)", voter_turnout: "70.4%" },
};

export default function MapPage() {
  const [selectedState, setSelectedState] = useState(null);
  const { language } = useLanguage();

  if (!MAPS_API_KEY) {
    return (
      <div className="app-container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <div className="gov-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 40px', borderTop: '4px solid #ef4444' }}>
           <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 24px' }} />
           <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '16px' }}>Google Maps Key Required</h2>
           <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
             To view the interactive election map, please add <code>VITE_MAPS_API_KEY</code> to your environment variables.
           </p>
           <Link to="/app" className="gov-button">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page" style={{ height: 'calc(100vh - 84px)', display: 'grid', gridTemplateColumns: 'minmax(340px, 400px) 1fr' }}>
      
      {/* ── Sidebar (Embedded Data) ── */}
      <aside style={{ background: 'var(--bg-aside)', borderRight: '1px solid var(--border)', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px', overflowY: 'auto' }}>
        
        <header>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0, 51, 102, 0.05)', padding: '6px 12px', borderRadius: '20px', marginBottom: '16px' }}>
            <BarChart3 size={14} color="var(--ashoka-blue)" />
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ashoka-blue)', textTransform: 'uppercase' }}>Consolidated ECI Data</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900 }}>Electoral Map</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Live integration of regional voting patterns and alliance dominance.
          </p>
        </header>

        {/* Details Panel */}
        <AnimatePresence mode="wait">
          {selectedState ? (
            <motion.div 
              key={selectedState}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="gov-card" 
              style={{ borderLeft: `6px solid ${ELECTION_RESULTS[selectedState]?.color}` }}
            >
               <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '20px' }}>{selectedState}</h3>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                     <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Dominant Alliance</span>
                     <span style={{ fontSize: '13px', fontWeight: 900, color: ELECTION_RESULTS[selectedState]?.color }}>{ELECTION_RESULTS[selectedState]?.alliance}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                     <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Lead Party</span>
                     <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ashoka-blue)' }}>{ELECTION_RESULTS[selectedState]?.lead}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                     <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Voter Turnout</span>
                     <span style={{ fontSize: '13px', fontWeight: 800 }}>{ELECTION_RESULTS[selectedState]?.voter_turnout}</span>
                  </div>
               </div>
               
               <button className="gov-button" style={{ width: '100%', marginTop: '24px', justifyContent: 'center', fontSize: '13px' }}>
                 Detailed Constituency Breakdown <ChevronRight size={14} />
               </button>
            </motion.div>
          ) : (
            <div className="gov-card" style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(0,0,0,0.02)', borderStyle: 'dashed' }}>
               <Layers size={32} color="var(--text-light)" style={{ margin: '0 auto 16px' }} />
               <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Click a state on the map to view integrated electoral data directly in this panel.</p>
            </div>
          )}
        </AnimatePresence>

        {/* Quick Select List */}
        <div>
          <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>QUICK SELECT</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {Object.keys(ELECTION_RESULTS).map(state => (
              <button 
                key={state}
                onClick={() => setSelectedState(state)}
                style={{ 
                  display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '8px', 
                  border: '1px solid var(--border)', background: selectedState === state ? '#fff' : 'transparent',
                  cursor: 'pointer', transition: 'var(--transition)',
                  boxShadow: selectedState === state ? 'var(--shadow-sm)' : 'none'
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: selectedState === state ? 'var(--ashoka-blue)' : 'var(--text-main)' }}>{state}</span>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: ELECTION_RESULTS[state].color, marginTop: '4px' }} />
              </button>
            ))}
          </div>
        </div>

      </aside>

      {/* ── Main Map ── */}
      <main style={{ position: 'relative', overflow: 'hidden' }}>
        <APIProvider apiKey={MAPS_API_KEY}>
          <Map
            style={{ width: '100%', height: '100%' }}
            defaultCenter={{ lat: 22.5937, lng: 78.9629 }}
            defaultZoom={5}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId={'96c340578619623d'}
          >
            <MapControl position={ControlPosition.TOP_LEFT}>
               <div style={{ margin: '20px' }}>
                  <Link to="/app" className="gov-button" style={{ boxShadow: 'var(--shadow-md)', background: '#fff', color: 'var(--ashoka-blue)' }}>
                    <ArrowLeft size={16} /> Dashboard
                  </Link>
               </div>
            </MapControl>
          </Map>
        </APIProvider>

        {/* Legend */}
        <div className="gov-card" style={{ position: 'absolute', bottom: '30px', right: '30px', padding: '14px 20px', display: 'flex', gap: '16px', boxShadow: 'var(--shadow-md)', zIndex: 10 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--eci-saffron)' }} /> <span style={{ fontSize: '11px', fontWeight: 800 }}>NDA</span></div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0052cc' }} /> <span style={{ fontSize: '11px', fontWeight: 800 }}>INDIA</span></div>
        </div>
      </main>

    </div>
  );
}
