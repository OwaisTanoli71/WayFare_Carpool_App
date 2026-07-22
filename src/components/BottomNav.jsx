import { Link, useLocation } from 'react-router-dom'
import { Home, Search, PlusCircle, MessageSquare, User } from 'lucide-react'

export default function BottomNav() {
  const location = useLocation()
  
  const navItems = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Find', path: '/find-ride', icon: Search },
    { name: 'Post', path: '/post-ride', icon: PlusCircle },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Profile', path: '/profile', icon: User }
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#14181C]/85 backdrop-blur-xl border-t border-white/5 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
      <div className="flex justify-around items-end h-[68px] px-2 pb-2">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          const isCenter = index === 2 // 'Post' button

          if (isCenter) {
            return (
              <div key={item.name} className="flex flex-col items-center justify-center w-[20%] h-full">
                <Link 
                  to={item.path}
                  className="absolute bottom-4 flex items-center justify-center w-[56px] h-[56px] rounded-full bg-gradient-to-tr from-[#FFB238] to-[#FFC565] text-[#14181C] shadow-[0_4px_20px_rgba(255,178,56,0.3)] transition-transform active:scale-90 z-10"
                >
                  <Icon size={28} strokeWidth={2.5} />
                </Link>
              </div>
            )
          }

          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={`flex flex-col items-center justify-end w-[20%] h-full gap-1 transition-all duration-300 active:scale-95 ${isActive ? 'text-[#FFB238]' : 'text-[#8B9298]'}`}
            >
              <div className={`relative flex items-center justify-center w-12 h-8 rounded-full transition-colors duration-300 ${isActive ? 'bg-[#FFB238]/15' : 'bg-transparent'}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] tracking-[0.2px] transition-colors duration-300 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
