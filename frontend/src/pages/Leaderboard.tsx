import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Medal, Award, Crown, Flame, TrendingUp, Users, Shield, Clock } from 'lucide-react'
import ReputationCard from '../components/ReputationCard'
import { useLeaderboard } from '../hooks/useCanopyRPC'

export default function Leaderboard() {
  const [limit, setLimit] = useState(50)
  const [timeframe, setTimeframe] = useState<'all' | 'week' | 'month'>('all')
  const { leaderboard, loading } = useLeaderboard(limit)

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />
    return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-400">{rank}</span>
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (rank === 2) return 'bg-gray-100 text-gray-700 border-gray-200'
    if (rank === 3) return 'bg-amber-100 text-amber-800 border-amber-200'
    return 'bg-white text-gray-600 border-gray-200'
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Reputation Leaderboard</h1>
        <p className="text-gray-600 text-lg max-w-xl mx-auto">
          Top community members ranked by onchain reputation score. 
          Trust is earned, not bought.
        </p>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 font-medium">Show:</span>
          {[10, 25, 50, 100].map((n) => (
            <button
              key={n}
              onClick={() => setLimit(n)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                limit === n
                  ? 'bg-canopy-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Top {n}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          {(['all', 'week', 'month'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                timeframe === t
                  ? 'bg-canopy-100 text-canopy-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* TOP 3 PODIUM */}
      {!loading && leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
          {[
            { rank: 2, user: leaderboard[1], color: 'from-gray-100 to-gray-50', icon: Medal },
            { rank: 1, user: leaderboard[0], color: 'from-yellow-100 to-yellow-50', icon: Trophy, tall: true },
            { rank: 3, user: leaderboard[2], color: 'from-amber-100 to-amber-50', icon: Award },
          ].map(({ rank, user, color, icon: Icon, tall }) => (
            <Link key={rank} to={`/profile/${user.address}`} className={`card text-center ${tall ? 'py-8' : 'py-6'} bg-gradient-to-b ${color} border-none`}>
              <Icon className={`w-8 h-8 mx-auto mb-2 ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-amber-600'}`} />
              <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-xl font-bold text-gray-700 mx-auto mb-2">
                {user.display_name.charAt(0).toUpperCase()}
              </div>
              <h3 className="font-bold text-gray-900 text-sm truncate px-2">{user.display_name}</h3>
              <p className="text-canopy-700 font-black text-lg mt-1">{user.reputation.toLocaleString()}</p>
              <p className="text-xs text-gray-500">reputation</p>
            </Link>
          ))}
        </div>
      )}

      {/* LEADERBOARD LIST */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-canopy-200 border-t-canopy-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading leaderboard...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="card text-center py-16">
          <Trophy className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Leaderboard Empty</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            No users have registered yet. Be the first to build your reputation!
          </p>
          <Link to="/" className="btn-primary mt-6 inline-block">
            Register Identity
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((identity, i) => {
            const rank = i + 1
            const percentage = (identity.reputation / 10000) * 100
            return (
              <Link key={identity.address} to={`/profile/${identity.address}`} className="block">
                <div className={`card p-4 flex items-center gap-4 hover:shadow-md transition-all ${getRankBadge(rank)} border`}>
                  {/* RANK */}
                  <div className="w-10 flex items-center justify-center flex-shrink-0">
                    {getRankIcon(rank)}
                  </div>

                  {/* AVATAR */}
                  <div className="w-12 h-12 rounded-full bg-canopy-100 flex items-center justify-center text-canopy-800 font-bold text-lg flex-shrink-0">
                    {identity.display_name.charAt(0).toUpperCase()}
                  </div>

                  {/* INFO */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{identity.display_name}</h3>
                    <p className="text-xs text-gray-500 truncate">{identity.bio || 'No bio'}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {identity.endorsement_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3" /> {identity.attestation_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3" /> {identity.badge_count}
                      </span>
                    </div>
                  </div>

                  {/* REPUTATION */}
                  <div className="text-right flex-shrink-0 w-32">
                    <div className="text-2xl font-black text-canopy-700">
                      {identity.reputation.toLocaleString()}
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-canopy-500 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* FOOTER STATS */}
      {!loading && leaderboard.length > 0 && (
        <div className="card bg-gray-50 text-center py-6">
          <p className="text-gray-500 text-sm">
            Showing top <span className="font-semibold text-gray-900">{Math.min(limit, leaderboard.length)}</span> of{' '}
            <span className="font-semibold text-gray-900">{leaderboard.length}</span> registered identities
          </p>
        </div>
      )}
    </div>
  )
}