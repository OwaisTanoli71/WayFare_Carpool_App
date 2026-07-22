import { useState, useRef, useEffect } from 'react'

export default function Dropdown({ label, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="field relative" ref={wrapperRef} onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
      {label && <label>{label}</label>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#F1EDE5', fontSize: '15px', fontWeight: 500 }}>
        <span>{value || 'Select option'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 overflow-hidden z-50 max-h-60 overflow-y-auto shadow-lg" style={{ background: '#20262C', border: '1px solid #252B31', borderRadius: '10px' }}>
          {options.map(opt => (
            <div 
              key={opt}
              className="cursor-pointer"
              style={{ 
                padding: '12px 16px', 
                borderBottom: '1px solid #252B31', 
                color: value === opt ? '#E8A33D' : '#F1EDE5',
                background: value === opt ? '#1B2025' : 'transparent',
                fontWeight: value === opt ? 600 : 400
              }}
              onClick={() => onChange(opt)}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
