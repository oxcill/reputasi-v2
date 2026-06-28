import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, User, SlidersHorizontal, TrendingUp } from 'lucide-react'
import ReputationCard from '../components/ReputationCard'
import { useSearch, useLeaderboard } from '../hooks/useCanopyRPC'

export default function Explore() {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'reputation' | 'newest' | 'endorsements'>('reputation')
  const { results, loading: searchLoading } = useSearch(query)
  const { leaderboard, loading: lbLoading } = useLeaderboard(50)

  const isSearching = query.length >= 2
  const displayUsers = isSearching ? results : leaderboard
  const loading = isSearching ? searchLoading : lbLoading

  const sortedUsers = [...displayUsers].sort((a, b) => {
    switch (sortBy) {
      case 'reputation': return b.reputation - a.reputation
      case 'newest': return b.created_at - a.created_at
      case 'endorsements': return b.endorsement_count - a.endorsement_count
      default: return 0
    }
  })

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Explore Community</h1>
        <p className="text-gray-600 text-lg max-w-xl mx-auto">
          Discover onchain identities, check reputation scores, and find trusted community members.
        </p>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="card max-w-3xl mx-auto">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, bio, or address..."
            className="input pl-12 text-lg"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500 mr-2">Sort by:</span>
          {(['reputation', 'newest', 'endorsements'] as const).map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                sortBy === sort
                  ? 'bg-canopy-100 text-canopy-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {sort}
            </button>
          ))}
        </div>
      </div>

      {/* RESULTS COUNT */}
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">
          {isSearching ? `Search results for "${query}"` : 'All community members'}
          <span className="font-semibold text-gray-900 ml-1">({sortedUsers.length})</span>
        </p>
        {isSearching && (
          <button onClick={() => setQuery('')} className="text-sm text-canopy-600 hover:underline">
            Clear search
          </button>
        )}
      </div>

      {/* USER GRID */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-canopy-200 border-t-canopy-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading community members...</p>
        </div>
      ) : sortedUsers.length === 0 ? (
        <div className="card text-center py-16">
          <User className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isSearching ? 'No users found' : 'No users yet'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {isSearching
              ? 'Try a different search term or browse all members.'
              : 'Be the first to register an identity and start building reputation!'}
          </p>
          {!isSearching && (
            <Link to="/" className="btn-primary mt-4 inline-block">
              Register Identity
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedUsers.map((identity) => (
            <Link key={identity.address} to={`/profile/${identity.address}`}>
              <ReputationCard identity={identity} />
            </Link>
          ))}
        </div>
      )}

      {/* TIPS */}
      {!isSearching && sortedUsers.length > 0 && (
        <div className="card bg-gradient-to-r from-canopy-50 to-white border-canopy-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-canopy-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-canopy-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">How Reputation Works</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Reputation is earned through staked endorsements, verified attestations, 
                governance participation, and account age. It cannot be bought — only earned 
                through genuine community contribution.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}