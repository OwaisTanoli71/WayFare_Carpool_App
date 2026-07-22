import { useState, useRef, useEffect } from 'react'
import { INCITY_ROUTES, INTERCITY_ROUTES } from '../data/routes'

export default function RouteSelector({ label, placeholder, value, onChange, type = 'intercity' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState([])
  const wrapperRef = useRef(null)
  
  const recentSearches = JSON.parse(localStorage.getItem('wayfare_recent_routes') || '[]')
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    const val = e.target.value
    onChange(val)
    setIsOpen(true)
    
    if (val.length >= 1) {
      const sourceList = type === 'in-city' ? INCITY_ROUTES : INTERCITY_ROUTES
      const filtered = sourceList.filter(r => r.toLowerCase().includes(val.toLowerCase()))
      setResults(filtered)
    } else {
      setResults([])
    }
  }

  const handleSelect = (route) => {
    onChange(route)
    setIsOpen(false)
    
    // Save to recent
    const updated = [route, ...recentSearches.filter(r => r !== route)].slice(0, 5)
    localStorage.setItem('wayfare_recent_routes', JSON.stringify(updated))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value) {
      // If we have results, pick the first one, else just use the value
      if (results.length > 0) {
        handleSelect(results[0])
      } else {
        handleSelect(value)
      }
    }
  }

  return (
    <div className="field relative" ref={wrapperRef}>
      {label && <label>{label}</label>}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        style={{ width: '100%', position: 'relative', zIndex: 10 }}
      />
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 overflow-hidden z-50 max-h-60 overflow-y-auto shadow-lg" style={{ background: '#20262C', border: '1px solid #252B31', borderRadius: '10px' }}>
          
          {/* Recent Searches */}
          {!value && recentSearches.length > 0 && (
            <div style={{ padding: '8px 16px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '1px', color: '#5C646B', fontWeight: 600, background: '#1B2025' }}>Recent</div>
          )}
          {!value && recentSearches.map(route => (
            <div 
              key={`recent-${route}`}
              className="cursor-pointer flex items-center gap-2"
              style={{ padding: '12px 16px', borderBottom: '1px solid #252B31', color: '#8B9298' }}
              onClick={() => handleSelect(route)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {route}
            </div>
          ))}

          {/* Live Search Results */}
          {results.length > 0 && value.length >= 1 && (
             <div style={{ padding: '8px 16px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '1px', color: '#5C646B', fontWeight: 600, background: '#1B2025' }}>
               {type === 'in-city' ? 'Locations' : 'Cities of Pakistan'}
             </div>
          )}
          {results.map(route => (
            <div 
              key={route}
              className="cursor-pointer"
              style={{ padding: '12px 16px', borderBottom: '1px solid #252B31', color: '#F1EDE5' }}
              onClick={() => handleSelect(route)}
            >
              {route}
            </div>
          ))}

          {/* No results */}
          {results.length === 0 && value.length > 0 && (
             <div 
               className="cursor-pointer"
               style={{ padding: '12px 16px', borderBottom: '1px solid #252B31' }}
               onClick={() => handleSelect(value)}
             >
               <div style={{ color: '#8B9298', fontSize: '12.5px', marginBottom: '4px' }}>Custom location</div>
               <div style={{ color: '#E8A33D', fontSize: '14px', fontWeight: 600 }}>Use "{value}" anyway</div>
             </div>
          )}
          
        </div>
      )}
    </div>
  )
}
