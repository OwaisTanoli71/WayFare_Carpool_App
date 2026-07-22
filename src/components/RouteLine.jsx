// The signature visual motif of the app: a glowing route between two nodes,
// with a soft dashed line that animates like a moving journey.
export default function RouteLine({ from, to, compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-ink-100">
        <span className="h-2 w-2 rounded-full bg-beacon shrink-0" />
        <svg width="40" height="8" className="shrink-0">
          <line x1="0" y1="4" x2="40" y2="4" stroke="#2C3363" strokeWidth="2" strokeDasharray="4 4" className="animate-dash" />
        </svg>
        <span className="h-2 w-2 rounded-full bg-verified shrink-0" />
      </div>
    )
  }

  return (
    <div className="w-full">
      <svg viewBox="0 0 400 60" className="w-full h-14">
        <line x1="20" y1="30" x2="380" y2="30" stroke="#2C3363" strokeWidth="2" strokeDasharray="6 6" className="animate-dash" />
        <circle cx="20" cy="30" r="6" fill="#FFB238" />
        <circle cx="20" cy="30" r="10" fill="none" stroke="#FFB238" strokeOpacity="0.4" strokeWidth="2" />
        <circle cx="380" cy="30" r="6" fill="#2FE1B8" />
        <circle cx="380" cy="30" r="10" fill="none" stroke="#2FE1B8" strokeOpacity="0.4" strokeWidth="2" />
      </svg>
      <div className="flex justify-between text-sm text-ink-100 -mt-2">
        <span className="font-medium text-ink-50">{from}</span>
        <span className="font-medium text-ink-50">{to}</span>
      </div>
    </div>
  )
}
