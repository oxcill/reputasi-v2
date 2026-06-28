import { Clock, ThumbsUp, ThumbsDown, Users } from 'lucide-react'
import type { Proposal } from '../hooks/useCanopyRPC'

interface Props { proposal: Proposal; onVote?: (yes: boolean) => void; canVote?: boolean }

export default function ProposalCard({ proposal, onVote, canVote }: Props) {
  const total = proposal.yes_votes + proposal.no_votes
  const yesPct = total > 0 ? (proposal.yes_votes / total) * 100 : 0
  const isActive = proposal.status === 'active'
  const timeLeft = Math.max(0, Math.floor((proposal.ends_at - Date.now() / 1000) / 3600))

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            isActive ? 'bg-canopy-100 text-canopy-700' : proposal.status === 'passed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
          }`}>
            {proposal.status.toUpperCase()}
          </span>
          <h3 className="font-semibold text-gray-900 mt-2">{proposal.title}</h3>
        </div>
        {isActive && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {timeLeft}h left
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{proposal.description}</p>
      
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Yes: {proposal.yes_votes}</span>
          <span>No: {proposal.no_votes}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-canopy-500 rounded-full transition-all" style={{ width: `${yesPct}%` }} />
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
          <Users className="w-3 h-3" />
          {proposal.voters.length} voters · {proposal.total_power} total power
        </div>
      </div>

      {isActive && canVote && onVote && (
        <div className="flex gap-2">
          <button onClick={() => onVote(true)} className="btn-primary flex-1 flex items-center justify-center gap-1 text-sm">
            <ThumbsUp className="w-4 h-4" /> Yes
          </button>
          <button onClick={() => onVote(false)} className="btn-secondary flex-1 flex items-center justify-center gap-1 text-sm">
            <ThumbsDown className="w-4 h-4" /> No
          </button>
        </div>
      )}
    </div>
  )
}