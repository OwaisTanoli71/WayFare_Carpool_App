export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base =
    'focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none'

  const variants = {
    primary:
      'bg-beacon text-ink-900 hover:bg-beacon-light shadow-glow hover:shadow-[0_0_50px_-6px_rgba(255,178,56,0.6)] shadow-inner-beacon font-semibold tracking-tight',
    secondary:
      'bg-ink-700 text-ink-50 border border-ink-600 shadow-inner hover:border-beacon/50 hover:bg-ink-700/80 hover:shadow-card',
    ghost: 'text-ink-100 hover:text-ink-50 hover:bg-ink-800',
    outline: 'border border-ink-600 text-ink-50 shadow-inner hover:border-beacon hover:text-beacon hover:shadow-card hover:bg-ink-800'
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
