import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  User, Shield, Heart, Award, TrendingUp, Calendar,
  ThumbsUp, ThumbsDown, MessageSquare, Lock, CheckCircle,
  Clock, Flame, Crown, Sprout, Leaf
} from 'lucide-react'
import ReputationCard from '../components/ReputationCard'
import EndorsementForm from '../components/EndorsementForm'
import AttestationList from '../components/AttestationList'
import BadgeCard from '../components/BadgeCard'
import {
  useIdentity, useReputation, useEndorsements,
  useAttestations, useBadges, giveEndorsement,
  createAttestation, verifyAttestation, claimBadge
} from '../hooks/useCanopyRPC'

type Tab = 'overview' | 'endorsements' | 'attestations' | 'badges'

export default function Profile() {
  const { address } = useParams<{ address: string }>()
  const { identity, loading: idLoading } = useIdentity(address || null)
  const { breakdown } = useReputation(address || '')
  const { endorsements: received } = useEndorsements(address || '', 'received')
  const { endorsements: given } = useEndorsements(address || '', 'given')
  const { attestations } = useAttestations(address || '')
  const { badges, userBadges } = useBadges(address)

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showAttestationForm, setShowAttestationForm] = useState(false)
  const [newClaim, setNewClaim] = useState('')
  const [newEvidence, setNewEvidence] = useState('')

  // Mock current user for demo
  const currentUser = '0xCURRENTUSER123'
  const isOwnProfile = address === currentUser

  const handleEndorse = async (amount: number, message: string) => {
    if (!address) return
    await giveEndorsement(currentUser, address, amount, message)
    window.location.reload()
  }

  const handleCreateAttestation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClaim || !address) return
    await createAttestation(address, newClaim, newEvidence, currentUser)
    setNewClaim('')
    setNewEvidence('')
    setShowAttestationForm(false)
    window.location.reload()
  }

  const handleVerify = async (id: string) => {
    await verifyAttestation(id, currentUser)
    window.location.reload()
  }

  const handleClaimBadge = async (badgeId: string) => {
    if (!address) return
    await claimBadge(badgeId, address)
    window.location.reload()
  }

  const getLevelInfo = (rep: number) => {
    if (rep >= 5000) return { label: 'Legend', color: 'text-red-600', bg: 'bg-red-50', icon: Flame }
    if (rep >= 3000) return { label: 'Elder', color: 'text-purple-600', bg: 'bg-purple-50', icon: Crown }
    if (rep >= 1500) return { label: 'Guardian', color: 'text-blue-600', bg: 'bg-blue-50', icon: Shield }
    if (rep >= 500) return { label: 'Sprout', color: 'text-canopy-600', bg: 'bg-canopy-50', icon: Sprout }
    return { label: 'Seedling', color: 'text-gray-500', bg: 'bg-gray-50', icon: Leaf }
  }

  if (idLoading) {
    return (
      <div className="text-center py-20">
        <div className="w-10 h-10 border-4 border-canopy-200 border-t-canopy-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading profile...</p>
      </div>
    )
  }

  if (!identity) {
    return (
      <div className="text-center py-20">
        <User className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Identity Not Found</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          This address hasn\'t registered an onchain identity yet. 
          Be the first to build reputation on Reputasi.
        </p>
      </div>
    )
  }

  const level = getLevelInfo(identity.reputation)
  const LevelIcon = level.icon
  const percentage = (identity.reputation / 10000) * 100
  const claimedBadgeIds = new Set(userBadges.map(ub => ub.badge_id))

  return (
    <div className="space-y-8">
      {/* PROFILE HEADER */}
      <div className="card">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-canopy-100 to-canopy-200 flex items-center justify-center text-canopy-800 font-black text-4xl shadow-inner">
            {identity.display_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">{identity.display_name}</h1>
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${level.bg} ${level.color}`}>
                <LevelIcon className="w-3 h-3" />
                {level.label}
              </span>
            </div>
            <p className="text-sm text-gray-400 font-mono mb-3 truncate">{identity.address}</p>
            <p className="text-gray-700 leading-relaxed mb-4">{identity.bio || 'No bio yet.'}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {new Date(identity.created_at * 1000).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4 text-canopy-500" />
                {identity.reputation.toLocaleString()} rep
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-blue-500" />
                {identity.badge_count} badges
              </span>
            </div>
          </div>
        </div>

        {/* REPUTATION BAR */}
        <div className="mt-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-semibold text-gray-700">Reputation Score</span>
            <span className="font-bold text-canopy-700 text-lg">
              {identity.reputation.toLocaleString()} <span className="text-gray-400 text-sm">/ 10,000</span>
            </span>
          </div>
          <div className="reputation-bar h-5">
            <div className="reputation-fill" style={{ width: `${percentage}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {percentage.toFixed(1)}% to Legend status
          </p>
        </div>
      </div>

      {/* REPUTATION BREAKDOWN */}
      {breakdown && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-canopy-600" />
            Reputation Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {Object.entries(breakdown.breakdown).map(([key, value]) => (
              <div key={key} className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-lg font-black text-gray-900">+{value}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">{key}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              <span>{breakdown.factors.endorsement_received} received</span>
            </div>
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-canopy-500" />
              <span>{breakdown.factors.endorsement_given} given</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              <span>{breakdown.factors.attestations_confirmed} confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{breakdown.factors.account_age_days} days old</span>
            </div>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['overview', 'endorsements', 'attestations', 'badges'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-canopy-600 text-canopy-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {!isOwnProfile && (
            <EndorsementForm
              toAddress={identity.address}
              toName={identity.display_name}
              onSubmit={handleEndorse}
            />
          )}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-5">Activity Summary</h3>
            <div className="space-y-3">
              {[
                { label: 'Endorsements Received', value: received.length, icon: Heart, color: 'text-red-500' },
                { label: 'Endorsements Given', value: given.length, icon: ThumbsUp, color: 'text-canopy-500' },
                { label: 'Attestations', value: attestations.length, icon: Shield, color: 'text-blue-500' },
                { label: 'Badges Earned', value: identity.badge_count, icon: Award, color: 'text-amber-500' },
                { label: 'Proposals Created', value: identity.proposal_count, icon: MessageSquare, color: 'text-purple-500' },
                { label: 'Votes Cast', value: identity.vote_count, icon: CheckCircle, color: 'text-green-500' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                    <span className="font-bold text-gray-900">{item.value}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: ENDORSEMENTS */}
      {activeTab === 'endorsements' && (
        <div className="space-y-8">
          <div>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Received ({received.length})
            </h3>
            {received.length === 0 ? (
              <div className="card text-center py-8 text-gray-500">
                No endorsements received yet. Build trust by contributing to the community!
              </div>
            ) : (
              <div className="space-y-3">
                {received.map((e, i) => (
                  <div key={i} className="card p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">From {e.from.slice(0, 14)}...</p>
                      {e.message && <p className="text-xs text-gray-500 mt-1 italic">"{e.message}"</p>}
                    </div>
                    <div className="text-right">
                      <span className="text-canopy-700 font-bold">{e.amount.toLocaleString()} tokens</span>
                      <p className="text-xs text-gray-400">{new Date(e.created_at * 1000).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-canopy-500" />
              Given ({given.length})
            </h3>
            {given.length === 0 ? (
              <div className="card text-center py-8 text-gray-500">
                No endorsements given yet. Support community members you trust!
              </div>
            ) : (
              <div className="space-y-3">
                {given.map((e, i) => (
                  <div key={i} className="card p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">To {e.to.slice(0, 14)}...</p>
                      {e.message && <p className="text-xs text-gray-500 mt-1 italic">"{e.message}"</p>}
                    </div>
                    <div className="text-right">
                      <span className="text-canopy-700 font-bold">{e.amount.toLocaleString()} tokens</span>
                      <p className="text-xs text-gray-400">{new Date(e.created_at * 1000).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: ATTESTATIONS */}
      {activeTab === 'attestations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-lg">Attestations</h3>
            <button
              onClick={() => setShowAttestationForm(!showAttestationForm)}
              className="btn-primary text-sm"
            >
              {showAttestationForm ? 'Cancel' : '+ Create Attestation'}
            </button>
          </div>

          {showAttestationForm && (
            <form onSubmit={handleCreateAttestation} className="card border-canopy-200 bg-canopy-50/30">
              <h4 className="font-bold text-gray-900 mb-4">Create New Attestation</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Claim</label>
                  <input
                    type="text"
                    value={newClaim}
                    onChange={(e) => setNewClaim(e.target.value)}
                    maxLength={200}
                    className="input"
                    placeholder="e.g., Expert in Solidity smart contract development"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Evidence (optional)</label>
                  <textarea
                    value={newEvidence}
                    onChange={(e) => setNewEvidence(e.target.value)}
                    maxLength={500}
                    rows={2}
                    className="input resize-none"
                    placeholder="Links, portfolio, or references"
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
                  Create Attestation
                </button>
              </div>
            </form>
          )}

          <AttestationList
            attestations={attestations}
            onVerify={handleVerify}
            canVerify={!isOwnProfile}
          />
        </div>
      )}

      {/* TAB: BADGES */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Soulbound Badges</h3>
            <p className="text-gray-500 text-sm mb-6">
              Achievement NFTs that cannot be traded or transferred. Earn them by meeting reputation milestones.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {badges.map((badge) => {
              const isClaimed = claimedBadgeIds.has(badge.id)
              const canClaim = !isClaimed &&
                identity.reputation >= badge.min_reputation &&
                identity.endorsement_count >= badge.min_endorsements &&
                identity.attestation_count >= badge.min_attestations &&
                (Date.now() / 1000 - identity.created_at) / 86400 >= badge.min_age_days

              return (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  claimed={isClaimed}
                  canClaim={canClaim}
                  onClaim={() => handleClaimBadge(badge.id)}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}