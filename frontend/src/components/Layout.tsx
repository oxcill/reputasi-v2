import { Outlet, Link, useLocation } from 'react-router-dom'
import { Leaf, Search, Trophy, Gavel, User } from 'lucide-react'

export default function Layout() {
  const location = useLocation()
  const navItems = [
    { path: '/', label: 'Home', icon: Leaf },
    { path: '/explore', label: 'Explore', icon: Search },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/governance', label: 'Governance', icon: Gavel },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Leaf className="w-6 h-6 text-canopy-600" />
              <span className="text-xl font-bold text-gray-900">Reputasi<span className="text-canopy-600">v2</span></span>
            </Link>
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link key={item.path} to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-canopy-50 text-canopy-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}>
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
            <button className="btn-primary flex items-center gap-2 text-sm">
              <User className="w-4 h-4" />
              Connect
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-gray-100 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-canopy-500" />
              <span>Reputasi v2 — Universal Social Layer for Canopy</span>
            </div>
            <div>Social-Fi Infrastructure</div>
          </div>
        </div>
      </footer>
    </div>
  )
}