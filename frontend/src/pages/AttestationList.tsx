import { CheckCircle, Clock, Shield, User, AlertTriangle } from 'lucide-react'
import type { Attestation } from '../hooks/useCanopyRPC'

interface AttestationListProps {
  attestations: Attestation[]
  onVerify?: (id: string) => Promise<void>
  canVerify?: boolean
}

export default function AttestationList({ attestations, onVerify, canVerify }: AttestationListProps) {
  if (attestations.length === 0) {
    return (
      <div className="card text-center py-12">
        <Shield className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attestations Yet</h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Attestations are community-verified claims about skills and contributions. 
          Create one to get started!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {attestations.map((att) => (
        <div
          key={att.id}
          className={`card p-5 transition-all ${
            att.confirmed
              ? 'border-canopy-200 bg-canopy-50/20'
              : 'border-yellow-200 bg-yellow-50/10'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* STATUS BADGE */}
              <div className="flex items-center gap-2 mb-3">
                {att.confirmed ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-canopy-100 text-canopy-700">
                    <CheckCircle className="w-3 h-3" />
                    Confirmed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                    <Clock className="w-3 h-3" />
                    Pending
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {att.verifier_count}/3 verifiers
                </span>
              </div>

              {/* CLAIM */}
              <p className="text-base font-semibold text-gray-900 mb-2 leading-relaxed">
                {att.claim}
              </p>

              {/* EVIDENCE */}
              {att.evidence && (
                <p className="text-sm text-gray-500 mb-3 bg-gray-50 rounded-lg p-3">
                  {att.evidence}
                </p>
              )}

              {/* META */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  By {att.created_by.slice(0, 12)}...
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(att.created_at * 1000).toLocaleDateString()}
                </span>
              </div>

              {/* VERIFIERS */}
              {att.verifiers.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Verified by:</span>
                  <div className="flex -space-x-1">
                    {att.verifiers.slice(0, 5).map((v, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full bg-canopy-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-canopy-700"
                        title={v}
                      >
                        {v.slice(0, 2).toUpperCase()}
                      </div>
                    ))}
                    {att.verifiers.length > 5 && (
                      <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-500">
                        +{att.verifiers.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* VERIFY BUTTON */}
            {!att.confirmed && canVerify && onVerify && (
              <button
                onClick={() => onVerify(att.id)}
                className="btn-primary text-sm py-2 px-4 flex-shrink-0"
              >
                <Shield className="w-4 h-4 inline mr-1" />
                Verify
              </button>
            )}

            {/* PENDING NOTICE */}
            {!att.confirmed && !canVerify && (
              <div className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg flex-shrink-0">
                <AlertTriangle className="w-3 h-3" />
                Needs {3 - att.verifier_count} more
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}