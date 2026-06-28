import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Gavel, Plus, ThumbsUp, ThumbsDown, Clock, Users,
  TrendingUp, AlertTriangle, CheckCircle, XCircle,
  ArrowRight, Zap, Shield, Vote
} from 'lucide-react'
import ProposalCard from '../components/ProposalCard'
import {
  useProposals, useGovernanceStats, useVotingPower,
  createProposal, voteProposal, delegateReputation, undelegateReputation
} from '../hooks/useCanopyRPC'

export default function Governance() {
  const [activeTab, setActiveTab] = useState<'active' | 'past' | 'delegation'>('active')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showDelegateForm, setShowDelegateForm] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(7) // days
  const [quorum, setQuorum] = useState(100)

  const [delegateTo, setDelegateTo] = useState('')

  // Mock current user
  const currentUser = '0xCURRENTUSER123'

  const { proposals: activeProposals, loading: activeLoading } = useProposals('active')
  const { proposals: allProposals, loading: allLoading } = useProposals()
  const { stats, loading: statsLoading } = useGovernanceStats()
  const { power, loading: powerLoading } = useVotingPower(currentUser)

  const pastProposals = allProposals.filter(p => p.status !== 'active')

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description) return
    await createProposal(title, description, duration * 86400, quorum, currentUser)
    setTitle('')
    setDescription('')
    setDuration(7)
    setQuorum(100)
    setShowCreateForm(false)
    window.location.reload()
  }

  const handleVote = async (proposalId: string, vote: boolean) => {
    await voteProposal(proposalId, vote)
    window.location.reload()
  }

  const handleDelegate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!delegateTo) return
    await delegateReputation(currentUser, delegateTo)
    setDelegateTo('')
    setShowDelegateForm(false)
    window.location.reload()
  }

  const handleUndelegate = async () => {
    await undelegateReputation(currentUser)
    window.location.reload()
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-semibold mb-6">
          <Gavel className="w-4 h-4" />
          Quadratic Governance
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Community Governance</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Vote with <strong>quadratic power</strong> — your influence grows with the square root of your reputation. 
          Whales cannot dominate.
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Your Voting Power', value: powerLoading ? '...' : power?.toString() || '0', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Active Proposals', value: statsLoading ? '...' : stats?.active_proposals?.toString() || '0', icon: Gavel, color: 'text-canopy-600', bg: 'bg-canopy-50' },
          { label: 'Total Proposals', value: statsLoading ? '...' : stats?.total_proposals?.toString() || '0', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Votes Cast', value: statsLoading ? '...' : stats?.total_votes_cast?.toString() || '0', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card text-center py-5">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-black text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* QUADRATIC EXPLANATION */}
      <div className="card bg-gradient-to-r from-amber-50 to-white border-amber-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">How Quadratic Voting Works</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your voting power equals the <strong>square root</strong> of your reputation. 
              A whale with 10,000 rep gets 100 votes. But 100 users with 100 rep each get 1,000 votes combined. 
              This prevents whale dominance and empowers genuine community participation.
            </p>
            <div className="mt-3 flex gap-4 text-xs">
              <span className="flex items-center gap-1 text-gray-500">
                <TrendingUp className="w-3 h-3" /> Power = √Reputation
              </span>
              <span className="flex items-center gap-1 text-gray-500">
                <Vote className="w-3 h-3" /> Delegation supported
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Proposal
        </button>
        <button
          onClick={() => setShowDelegateForm(!showDelegateForm)}
          className="btn-secondary flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Delegate Power
        </button>
      </div>

      {/* CREATE PROPOSAL FORM */}
      {showCreateForm && (
        <form onSubmit={handleCreateProposal} className="card border-canopy-200 bg-canopy-50/30">
          <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Plus className="w-5 h-5 text-canopy-600" />
            Create New Proposal
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="input"
                placeholder="e.g., Add new badge tier for 10,000+ reputation"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={4}
                className="input resize-none"
                placeholder="Detailed description of the proposal..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (days)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quorum (min votes)</label>
                <input
                  type="number"
                  min={10}
                  value={quorum}
                  onChange={(e) => setQuorum(Number(e.target.value))}
                  className="input"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1">Submit Proposal</button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* DELEGATE FORM */}
      {showDelegateForm && (
        <form onSubmit={handleDelegate} className="card border-blue-200 bg-blue-50/30">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Delegate Voting Power
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Delegate your voting power to a trusted community member. You cannot vote directly while delegated.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={delegateTo}
              onChange={(e) => setDelegateTo(e.target.value)}
              placeholder="Enter delegate address (0x...)"
              className="input flex-1"
              required
            />
            <button type="submit" className="btn-primary">Delegate</button>
            <button type="button" onClick={() => setShowDelegateForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {/* TABS */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['active', 'past', 'delegation'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-canopy-600 text-canopy-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'active' && <Gavel className="w-4 h-4 inline mr-1" />}
            {tab === 'past' && <Clock className="w-4 h-4 inline mr-1" />}
            {tab === 'delegation' && <Users className="w-4 h-4 inline mr-1" />}
            {tab}
          </button>
        ))}
      </div>

      {/* TAB: ACTIVE PROPOSALS */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Active Proposals <span className="text-gray-400 text-sm font-normal">({activeProposals.length})</span>
            </h2>
          </div>

          {activeLoading ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 border-4 border-canopy-200 border-t-canopy-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading proposals...</p>
            </div>
          ) : activeProposals.length === 0 ? (
            <div className="card text-center py-16">
              <Gavel className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Proposals</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                There are no active governance proposals right now. Create one to start a community decision!
              </p>
              <button onClick={() => setShowCreateForm(true)} className="btn-primary">
                Create First Proposal
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {activeProposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onVote={(vote) => handleVote(proposal.id, vote)}
                  canVote={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: PAST PROPOSALS */}
      {activeTab === 'past' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">
            Past Proposals <span className="text-gray-400 text-sm font-normal">({pastProposals.length})</span>
          </h2>

          {allLoading ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 border-4 border-canopy-200 border-t-canopy-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading proposals...</p>
            </div>
          ) : pastProposals.length === 0 ? (
            <div className="card text-center py-16">
              <Clock className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">No past proposals yet. History will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastProposals.map((proposal) => (
                <div key={proposal.id} className="card p-5 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {proposal.status === 'passed' ? (
                        <CheckCircle className="w-4 h-4 text-canopy-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        proposal.status === 'passed' ? 'bg-canopy-100 text-canopy-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {proposal.status.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{proposal.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {proposal.yes_votes} yes · {proposal.no_votes} no · {proposal.voters.length} voters
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-lg font-bold text-gray-900">{proposal.total_power.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">total power</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: DELEGATION */}
      {activeTab === 'delegation' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Your Delegation Status
            </h3>
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <p className="text-gray-600 mb-4">
                You currently have <strong className="text-gray-900">{power}</strong> voting power.
              </p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setShowDelegateForm(true)} className="btn-primary">
                  Delegate to Someone
                </button>
                <button onClick={handleUndelegate} className="btn-danger">
                  Undelegate
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">How Delegation Works</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-canopy-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-canopy-700">1</span>
                </div>
                <p>Choose a trusted community member with <strong>1,000+ reputation</strong> to delegate your voting power to.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-canopy-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-canopy-700">2</span>
                </div>
                <p>Your delegate votes on your behalf. You <strong>cannot vote directly</strong> while delegated.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-canopy-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-canopy-700">3</span>
                </div>
                <p>Undelegate anytime to regain your direct voting power. No cooldown period.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}