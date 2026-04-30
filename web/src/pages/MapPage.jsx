import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Info, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

// URL for India states TopoJSON
const INDIA_TOPO_JSON = "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/india/india-states.json";

// 2024 Election Results data mock (winning alliance per state)
const ELECTION_DATA = {
  "Andaman and Nicobar": "NDA",
  "Andhra Pradesh": "NDA",
  "Arunachal Pradesh": "NDA",
  "Assam": "NDA",
  "Bihar": "NDA",
  "Chandigarh": "INDIA",
  "Chhattisgarh": "NDA",
  "Dadra and Nagar Haveli": "NDA",
  "Daman and Diu": "NDA",
  "Delhi": "NDA",
  "Goa": "NDA",
  "Gujarat": "NDA",
  "Haryana": "INDIA",
  "Himachal Pradesh": "INDIA",
  "Jammu and Kashmir": "INDIA",
  "Jharkhand": "NDA",
  "Karnataka": "NDA",
  "Kerala": "INDIA",
  "Lakshadweep": "INDIA",
  "Madhya Pradesh": "NDA",
  "Maharashtra": "INDIA",
  "Manipur": "INDIA",
  "Meghalaya": "INDIA",
  "Mizoram": "NDA",
  "Nagaland": "INDIA",
  "Odisha": "NDA",
  "Puducherry": "INDIA",
  "Punjab": "INDIA",
  "Rajasthan": "NDA",
  "Sikkim": "NDA",
  "Tamil Nadu": "INDIA",
  "Telangana": "NDA",
  "Tripura": "NDA",
  "Uttar Pradesh": "INDIA",
  "Uttarakhand": "NDA",
  "West Bengal": "INDIA"
};

const PARTY_COLORS = {
  "NDA": "var(--eci-saffron)", // Saffron
  "INDIA": "#0052cc",          // Congress Blue
  "OTHERS": "#10b981",         // Green
  "DEFAULT": "#cbd5e1"         // Slate 300
};

export default function MapPage() {
  const [tooltipContent, setTooltipContent] = useState("");
  const [selectedState, setSelectedState] = useState(null);

  // Helper to normalize state names from the topojson
  const normalizeStateName = (name) => {
    if (!name) return "";
    return name.replace(" and ", " & ").replace(" Islands", "").trim();
  };

  return (
    <div className="app-container" style={{ padding: '60px 0 100px' }}>
      
      {/* ── Page Header ── */}
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(0, 51, 102, 0.05)', padding: '8px 16px', borderRadius: '30px', marginBottom: '16px' }}>
          <MapPin size={18} color="var(--ashoka-blue)" />
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ashoka-blue)', textTransform: 'uppercase', letterSpacing: '1px' }}>Electoral Geography</span>
        </div>
        <h1 className="section-title" style={{ fontSize: '42px', fontWeight: 900 }}>2024 Election Results Map</h1>
        <p className="section-subtitle" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Explore the political landscape of India. Hover over states to see the dominating alliances from the 18th Lok Sabha elections.
        </p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', background: PARTY_COLORS.NDA, borderRadius: '4px' }} /> <span style={{ fontSize: '14px', fontWeight: 700 }}>NDA Alliance</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', background: PARTY_COLORS.INDIA, borderRadius: '4px' }} /> <span style={{ fontSize: '14px', fontWeight: 700 }}>I.N.D.I.A Bloc</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', background: PARTY_COLORS.OTHERS, borderRadius: '4px' }} /> <span style={{ fontSize: '14px', fontWeight: 700 }}>Others / Regional</span></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Map Container */}
        <section className="gov-card" style={{ position: 'relative', overflow: 'hidden', padding: 0 }}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 1000, center: [78.9629, 22.5937] }}
            style={{ width: '100%', height: 'auto', background: 'var(--bg-aside)' }}
          >
            <Geographies geography={INDIA_TOPO_JSON}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  // The TopoJSON property for state name is typically geo.properties.NAME_1 or similar
                  const stateName = geo.properties.NAME_1 || geo.properties.name;
                  const party = ELECTION_DATA[stateName] || "DEFAULT";
                  const color = PARTY_COLORS[party] || PARTY_COLORS.DEFAULT;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                        setTooltipContent(`${stateName} — ${party !== "DEFAULT" ? party : "Data Unavailable"}`);
                        setSelectedState(stateName);
                      }}
                      onMouseLeave={() => {
                        setTooltipContent("");
                        setSelectedState(null);
                      }}
                      style={{
                        default: { fill: color, stroke: "#FFF", strokeWidth: 0.5, outline: "none" },
                        hover:   { fill: "#1e293b", stroke: "#FFF", strokeWidth: 1, outline: "none", cursor: "pointer", transition: "all 0.2s" },
                        pressed: { fill: "var(--ashoka-blue)", outline: "none" }
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>

          {/* Tooltip Overlay */}
          <AnimatePresence>
            {tooltipContent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--ashoka-blue)', color: '#fff', padding: '12px 24px',
                  borderRadius: '30px', fontWeight: 800, fontSize: '15px', boxShadow: 'var(--shadow-md)',
                  pointerEvents: 'none'
                }}
              >
                {tooltipContent}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        
        <div style={{ textAlign: 'center' }}>
          <Link to="/app" className="gov-button gov-button-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
