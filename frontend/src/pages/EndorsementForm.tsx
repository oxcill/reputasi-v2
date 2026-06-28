import { useState } from 'react'
import { Heart, Loader2, Info } from 'lucide-react'

interface EndorsementFormProps {
  toAddress: string
  toName: string
  onSubmit: (amount: number, message: string) => Promise<void>
}

export default function EndorsementForm({ toAddress, toName, onSubmit }: EndorsementFormProps) {
  const [amount, setAmount] = useState(100)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (amount < 10) return
    setLoading(true)
    try {
      await onSubmit(amount, message)
      setMessage('')
      setAmount(100)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card border-red-100">
      <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
        <Heart className="w-5 h-5 text-red-500" />
        Endorse {toName}
      </h3>
      <p className="text-sm text-gray-500 mb-5">
        Stake tokens to show trust. Minimum 10 tokens. Revoke possible after 7 days (10% penalty).
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Amount <span className="text-gray-400 font-normal">(min: 10)</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min={10}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="input pr-20"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
              tokens
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <Info className="w-3 h-3" />
            You have 100,000 tokens available
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Message <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={280}
            rows={3}
            className="input resize-none"
            placeholder={`Why are you endorsing ${toName}?`}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/280</p>
        </div>

        <button
          type="submit"
          disabled={loading || amount < 10}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 py-3"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Heart className="w-4 h-4" />
              Give Endorsement ({amount} tokens)
            </>
          )}
        </button>
      </div>
    </form>
  )
}