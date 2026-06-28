import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Leaf, ArrowRight, Shield, Heart, Award, Gavel, BadgeCheck, TrendingUp, Zap } from 'lucide-react'
import ReputationCard from '../components/ReputationCard'
import { useLeaderboard } from '../hooks/useCanopyRPC'

export default function Home() {
  const { leaderboard, loading } = useLeaderboard(6)
  const [demoAddress, setDemoAddress] = useState('')

  const features = [
    {
      icon: Shield,
      title: 'Onchain Identity',
      desc: 'Register your unique social profile with verifiable reputation.',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: Heart,
      title: 'Staked Endorsements',
      desc: 'Back other users with tokens — real economic trust, not fake followers.',
      color: 'bg-red-50 text-red-600',
    },
    {
      icon: BadgeCheck,
      title: 'Verifiable Attestations',
      desc: 'Community-validated claims about skills and contributions.',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      icon: Gavel,
      title: 'Quadratic Governance',
      desc: 'Vote with sqrt(reputation) — whales cannot dominate.',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      icon: Award,
      title: 'Soulbound Badges',
      desc: 'Achievement NFTs that cannot be traded or faked.',
      color: 'bg-canopy-50 text-canopy-600',
    },
    {
      icon: Zap,
      title: 'Slashing DAO',
      desc: 'Community-driven quality control for bad actors.',
      color: 'bg-orange-50 text-orange-600',
    },
  ]

  const stats = [
    { label: 'Tx Types', value: '13', desc: 'Custom onchain transactions' },
    { label: 'RPC Endpoints', value: '13', desc: 'Read/write integration' },
    { label: 'Governance', value: 'Quadratic', desc: 'Anti-whale voting' },
    { label: 'Badges', value: '5 Tiers', desc: 'Soulbound achievements' },
  ]

  return (
    <div className="space-y-16">
      {/* HERO */}
      <section className="text-center py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-canopy-50/50 to-transparent -z-10 rounded-3xl" />
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-canopy-100 text-canopy-800 rounded-full text-sm font-semibold mb-8">
          <Leaf className="w-4 h-4" />
          Canopy Vibe Code Contest #2 — Social-Fi Infrastructure Layer
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
          Your Reputation, <span className="text-canopy-600">Universal</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4 leading-relaxed">
          The first onchain reputation infrastructure that makes trust <strong>portable</strong> across all communities.
        </p>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
          Staked endorsements. Quadratic governance. Soulbound badges. Community slashing.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/explore" className="btn-primary flex items-center gap-2 text-lg px-8 py-3">
            Explore Community
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/governance" className="btn-secondary text-lg px-8 py-3">
            Governance
          </Link>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card text-center py-6">
            <div className="text-3xl font-black text-canopy-700 mb-1">{s.value}</div>
            <div className="text-sm font-semibold text-gray-900">{s.label}</div>
            <div className="text-xs text-gray-500 mt-1">{s.desc}</div>
          </div>
        ))}
      </section>

      {/* FEATURES GRID */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Built for Real Communities</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Not just another social app — an infrastructure layer that any dApp can use.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="card card-hover">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* QUICK LOOKUP */}
      <section className="card bg-gradient-to-r from-canopy-50 to-white border-canopy-200">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Look Up Any Profile</h3>
            <p className="text-gray-600 text-sm mb-4">
              Search by address to see reputation, endorsements, badges, and governance power.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              value={demoAddress}
              onChange={(e) => setDemoAddress(e.target.value)}
              placeholder="Enter address (0x...)"
              className="input flex-1 md:w-80"
            />
            <Link
              to={`/profile/${demoAddress}`}
              className="btn-primary whitespace-nowrap"
              onClick={(e) => !demoAddress && e.preventDefault()}
            >
              <TrendingUp className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* TOP USERS */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Top Community Members</h2>
            <p className="text-gray-500 text-sm mt-1">Highest reputation scores this week</p>
          </div>
          <Link to="/leaderboard" className="text-canopy-600 font-semibold hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-canopy-200 border-t-canopy-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="card text-center py-12">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users registered yet. Be the first!</p>
            <Link to="/explore" className="btn-primary mt-4 inline-block">Register Identity</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {leaderboard.map((identity, i) => (
              <Link key={identity.address} to={`/profile/${identity.address}`}>
                <ReputationCard identity={identity} rank={i + 1} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="card bg-gray-900 text-white text-center py-16">
        <h2 className="text-3xl font-bold mb-4">Ready to Build Trust?</h2>
        <p className="text-gray-400 max-w-xl mx-auto mb-8">
          Join the first onchain reputation infrastructure. Register your identity, earn endorsements, 
          and unlock governance power.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/explore" className="bg-canopy-500 hover:bg-canopy-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
            Get Started
          </Link>
          <a href="https://github.com/username/reputasi-v2" target="_blank" rel="noopener" className="text-gray-400 hover:text-white transition-colors font-medium">
            View on GitHub →
          </a>
        </div>
      </section>
    </div>
  )
}