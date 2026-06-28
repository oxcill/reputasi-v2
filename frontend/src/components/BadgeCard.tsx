import { Lock, CheckCircle } from 'lucide-react'
import type { Badge } from '../hooks/useCanopyRPC'

interface Props { badge: Badge; claimed?: boolean; canClaim?: boolean; onClaim?: () => void }

export default function BadgeCard({ badge, claimed, canClaim, onClaim }: Props) {
  return (
    <div className={`card p-4 ${claimed ? 'border-canopy-300 bg-canopy-50' : 'opacity-75'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: badge.color + '20' }}>
          {badge.name.split(' ')[0]}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{badge.name}</h4>
          <p className="text-xs text-gray-500">{badge.description}</p>
        </div>
      </div>
      <div className="space-y-1 text-xs text-gray-600 mb-3">
        <div className="flex justify-between"><span>Min Reputation:</span><span className="font-medium">{badge.min_reputation}</span></div>
        <div className="flex justify-between"><span>Min Endorsements:</span><span className="font-medium">{badge.min_endorsements}</span></div>
        <div className="flex justify-between"><span>Min Attestations:</span><span className="font-medium">{badge.min_attestations}</span></div>
        <div className="flex justify-between"><span>Min Age:</span><span className="font-medium">{badge.min_age_days} days</span></div>
      </div>
      {claimed ? (
        <div className="flex items-center gap-1 text-canopy-600 text-sm font-medium">
          <CheckCircle className="w-4 h-4" /> Claimed
        </div>
      ) : canClaim ? (
        <button onClick={onClaim} className="btn-primary w-full text-sm">Claim Badge</button>
      ) : (
        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <Lock className="w-4 h-4" /> Locked
        </div>
      )}
    </div>
  )
}