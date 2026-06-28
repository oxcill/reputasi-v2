import { Shield, Award, Clock, Users, Flame, Crown } from 'lucide-react'
import type { Identity } from '../hooks/useCanopyRPC'

interface Props { identity: Identity; rank?: number }

export default function ReputationCard({ identity, rank }: Props) {
  const percentage = (identity.reputation / 10000) * 100
  const getLevel = (rep: number) => {
    if (rep >= 5000) return { label: 'Legend', color: 'text-red-600', icon: Flame }
    if (rep >= 3000) return { label: 'Elder', color: 'text-purple-600', icon: Crown }
    if (rep >= 1500) return { label: 'Guardian', color: 'text-blue-600', icon: Shield }
    if (rep >= 500) return { label: 'Sprout', color: 'text-canopy-600', icon: Award }
    return { label: 'Seedling', color: 'text-gray-500', icon: Clock }
  }
  const level = getLevel(identity.reputation)
  const LevelIcon = level.icon

  return (
    <div className="card card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-canopy-100 flex items-center justify-center text-canopy-700 font-bold text-lg">
            {identity.display_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{identity.display_name}</h3>
            <div className={`text-xs font-medium flex items-center gap-1 ${level.color}`}>
              <LevelIcon className="w-3 h-3" />
              {level.label}
            </div>
          </div>
        </div>
        {rank && (
          <div className="flex items-center gap-1 text-amber-500">
            <Award className="w-5 h-5" />
            <span className="font-bold">#{rank}</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{identity.bio}</p>
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Reputation</span>
          <span className="font-medium text-gray-900">{identity.reputation.toLocaleString()}</span>
        </div>
        <div className="reputation-bar">
          <div className="reputation-fill" style={{ width: `${percentage}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <div className="text-xs font-medium text-gray-900">{identity.endorsement_count}</div>
          <div className="text-[10px] text-gray-500">Endorsements</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <Shield className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <div className="text-xs font-medium text-gray-900">{identity.attestation_count}</div>
          <div className="text-[10px] text-gray-500">Attestations</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <Award className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <div className="text-xs font-medium text-gray-900">{identity.badge_count}</div>
          <div className="text-[10px] text-gray-500">Badges</div>
        </div>
      </div>
    </div>
  )
}