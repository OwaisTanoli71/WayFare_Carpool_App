import React from 'react'

export default function InputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  icon,
  rightElement,
  className = ''
}) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-medium text-white ml-1">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-ink-700/60 bg-[#0F131C] py-2.5 ${
            icon ? 'pl-9' : 'px-3'
          } ${rightElement ? 'pr-10' : 'pr-3'} text-xs text-white placeholder-ink-400 transition-colors focus:border-[#F59E0B] focus:outline-none focus:ring-1 focus:ring-[#F59E0B] ${className}`}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  )
}
