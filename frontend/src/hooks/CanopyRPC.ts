import { useState, useEffect } from 'react'

// ============================================================================
// CANOPY NETWORK RPC CONFIGURATION
// ============================================================================
// Port 50002 = Public JSON-RPC (read queries, transaction broadcast)
// Port 50003 = Admin JSON-RPC (wallet operations, key management)
// 
// For plugins: Custom RPC endpoints are registered on the same port 50002
// and prefixed with /reputasi/
// ============================================================================

const RPC_URL = 'http://localhost:50002'
const ADMIN_RPC_URL = 'http://localhost:50003'

// Canopy uses standard JSON-RPC 2.0 format
interface JSONRPCRequest {
  jsonrpc: '2.0'
  method: string
  params: unknown[]
  id: number
}

interface JSONRPCResponse<T> {
  jsonrpc: '2.0'
  result?: T
  error?: { code: number; message: string }
  id: number
}

// ============================================================================
// TYPES
// ============================================================================

export interface Identity {
  address: string
  display_name: string
  bio: string
  avatar_url: string
  created_at: number
  reputation: number
  endorsement_count: number
  attestation_count: number
  badge_count: number
  proposal_count: number
  vote_count: number
  report_count: number
  slashed_amount: number
  delegated_to?: string
  delegated_from?: string[]
}

export interface Endorsement {
  from: string
  to: string
  amount: number
  message: string
  created_at: number
  active: boolean
}

export interface Attestation {
  id: string
  subject: string
  claim: string
  evidence: string
  created_by: string
  created_at: number
  verifiers: string[]
  verifier_count: number
  confirmed: boolean
}

export interface Proposal {
  id: string
  title: string
  description: string
  created_by: string
  created_at: number
  ends_at: number
  status: 'active' | 'passed' | 'rejected' | 'executed'
  yes_votes: number
  no_votes: number
  total_power: number
  voters: string[]
  quorum: number
}

export interface Badge {
  id: string
  name: string
  description: string
  image_url: string
  min_reputation: number
  min_endorsements: number
  min_attestations: number
  min_age_days: number
  color: string
}

export interface UserBadge {
  badge_id: string
  user: string
  claimed_at: number
}

export interface Report {
  id: string
  target: string
  reporter: string
  reason: string
  evidence: string
  created_at: number
  status: 'pending' | 'confirmed' | 'rejected'
  votes: number
  voters: string[]
}

export interface ReputationBreakdown {
  address: string
  reputation: number
  breakdown: {
    base: number
    endorsements: number
    attestations: number
    age: number
    activity: number
    governance: number
    badges: number
    penalty: number
  }
  factors: {
    endorsement_received: number
    endorsement_given: number
    attestations_confirmed: number
    attestations_pending: number
    account_age_days: number
    proposals_created: number
    votes_cast: number
    badges_claimed: number
    slashed_amount: number
  }
}

// ============================================================================
// CORE RPC HELPERS
// ============================================================================

/**
 * Call a standard Canopy JSON-RPC method
 * Used for: blockchain queries, account info, transaction status
 */
async function callRPC<T>(method: string, params: unknown[] = []): Promise<T> {
  const request: JSONRPCRequest = {
    jsonrpc: '2.0',
    method,
    params,
    id: Date.now(),
  }

  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`RPC HTTP error: ${response.status}`)
  }

  const data: JSONRPCResponse<T> = await response.json()
  
  if (data.error) {
    throw new Error(`RPC error ${data.error.code}: ${data.error.message}`)
  }

  if (data.result === undefined) {
    throw new Error('RPC returned undefined result')
  }

  return data.result
}

/**
 * Call Admin RPC (port 50003)
 * Used for: wallet unlock, signing, key management
 * REQUIRES: wallet to be unlocked or password in request
 */
async function callAdminRPC<T>(method: string, params: unknown[] = []): Promise<T> {
  const request: JSONRPCRequest = {
    jsonrpc: '2.0',
    method,
    params,
    id: Date.now(),
  }

  const response = await fetch(ADMIN_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Admin RPC HTTP error: ${response.status}`)
  }

  const data: JSONRPCResponse<T> = await response.json()
  
  if (data.error) {
    throw new Error(`Admin RPC error ${data.error.code}: ${data.error.message}`)
  }

  return data.result!
}

/**
 * Query plugin custom RPC endpoint (registered by the Go plugin)
 * These endpoints are registered via RegisterRPCHandlers in main.go
 * and are served on port 50002 alongside standard RPC methods
 */
async function queryPlugin<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${RPC_URL}${endpoint}`)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, value)
    }
  })

  const response = await fetch(url.toString())
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
    throw new Error(err.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// ============================================================================
// STANDARD CANOPY RPC METHODS
// ============================================================================

/**
 * Get account balance from Canopy node
 * Maps to: canopy_getBalance or similar standard method
 */
export async function getAccountBalance(address: string): Promise<string> {
  // Standard Canopy RPC method for balance query
  // Replace with actual Canopy method name from AGENTS.md
  return callRPC('canopy_getBalance', [address])
}

/**
 * Get transaction by hash
 */
export async function getTransaction(hash: string): Promise<unknown> {
  return callRPC('canopy_getTransaction', [hash])
}

/**
 * Get latest block height
 */
export async function getBlockHeight(): Promise<number> {
  return callRPC('canopy_blockHeight', [])
}

/**
 * Submit a raw signed transaction to the network
 * This is the REAL way to submit transactions on Canopy
 */
export async function sendRawTransaction(signedTxHex: string): Promise<string> {
  return callRPC('canopy_sendRawTransaction', [signedTxHex])
}

// ============================================================================
// PLUGIN CUSTOM RPC QUERIES (Read-only, port 50002)
// ============================================================================

export function useIdentity(address: string | null) {
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address) { setLoading(false); return }
    
    queryPlugin<{ error?: string } & Identity>('/reputasi/identity', { address })
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setIdentity(data)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [address])

  return { identity, loading, error }
}

export function useLeaderboard(limit = 50) {
  const [leaderboard, setLeaderboard] = useState<Identity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    queryPlugin<{ leaderboard: Identity[] }>('/reputasi/leaderboard', { limit: String(limit) })
      .then((data) => setLeaderboard(data.leaderboard))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [limit])

  return { leaderboard, loading }
}

export function useEndorsements(address: string, direction: 'given' | 'received' = 'received') {
  const [endorsements, setEndorsements] = useState<Endorsement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    queryPlugin<{ endorsements: Endorsement[] }>('/reputasi/endorsements', { address, direction })
      .then((data) => setEndorsements(data.endorsements))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [address, direction])

  return { endorsements, loading }
}

export function useAttestations(address: string, status?: 'pending' | 'confirmed') {
  const [attestations, setAttestations] = useState<Attestation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params: Record<string, string> = { address }
    if (status) params.status = status
    queryPlugin<{ attestations: Attestation[] }>('/reputasi/attestations', params)
      .then((data) => setAttestations(data.attestations))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [address, status])

  return { attestations, loading }
}

export function useReputation(address: string) {
  const [breakdown, setBreakdown] = useState<ReputationBreakdown | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    queryPlugin<ReputationBreakdown>('/reputasi/reputation', { address })
      .then(setBreakdown)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [address])

  return { breakdown, loading }
}

export function useSearch(query: string) {
  const [results, setResults] = useState<Identity[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    setLoading(true)
    queryPlugin<{ results: Identity[] }>('/reputasi/search', { q: query })
      .then((data) => setResults(data.results))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [query])

  return { results, loading }
}

export function useBadges(address?: string) {
  const [badges, setBadges] = useState<Badge[]>([])
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params: Record<string, string> = {}
    if (address) params.address = address
    queryPlugin<{ badges: Badge[]; userBadges?: UserBadge[] }>('/reputasi/badges', params)
      .then((data) => {
        setBadges(data.badges)
        if (data.userBadges) setUserBadges(data.userBadges)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [address])

  return { badges, userBadges, loading }
}

export function useProposals(status?: 'active') {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params: Record<string, string> = {}
    if (status) params.status = status
    queryPlugin<{ proposals: Proposal[] }>('/reputasi/proposals', params)
      .then((data) => setProposals(data.proposals))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [status])

  return { proposals, loading }
}

export function useVotingPower(address: string) {
  const [power, setPower] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    queryPlugin<{ voting_power: number }>('/reputasi/voting-power', { address })
      .then((data) => setPower(data.voting_power))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [address])

  return { power, loading }
}

export function useGovernanceStats() {
  const [stats, setStats] = useState<{
    total_proposals: number
    active_proposals: number
    total_votes_cast: number
    total_yes_votes: number
    total_no_votes: number
    quadratic_voting: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    queryPlugin<typeof stats>('/reputasi/governance-stats')
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { stats, loading }
}

// ============================================================================
// TRANSACTION SUBMISSION (Write to chain)
// ============================================================================
// 
// REAL Canopy transaction flow:
// 1. Build transaction object with custom type + data
// 2. Serialize to bytes
// 3. Sign with private key (via Admin RPC or local wallet)
// 4. Submit via sendRawTransaction
//
// For the contest/demo, we use a simplified flow that works with the local node
// ============================================================================

/**
 * Build and submit a custom plugin transaction
 * 
 * In production, this would:
 * 1. Create Transaction struct with nonce, gas, etc.
 * 2. Serialize transaction data
 * 3. Sign with sender's private key
 * 4. Call sendRawTransaction with signed hex
 * 
 * For demo/local development, we use a simplified approach
 * that submits via the admin RPC or a local tx endpoint
 */
export async function submitTransaction(
  type: number,
  data: unknown,
  senderAddress: string,
  // In production, add: privateKey or signer function
): Promise<{ hash: string; status: string }> {
  
  // Build the transaction payload
  const txPayload = {
    type,                           // Custom transaction type (0x01 - 0x0D)
    data: JSON.stringify(data),    // Serialized transaction data
    sender: senderAddress,
    nonce: await getNextNonce(senderAddress),
    timestamp: Date.now(),
  }

  // For LOCAL DEMO ONLY: Submit via a simplified endpoint
  // In production, you would:
  // 1. Serialize txPayload to bytes
  // 2. Sign with ECDSA/BLS private key
  // 3. Call canopy_sendRawTransaction
  
  try {
    // Try admin RPC first (for local development with unlocked wallet)
    const result = await callAdminRPC<string>('canopy_sendTransaction', [txPayload])
    return { hash: result, status: 'submitted' }
  } catch (adminErr) {
    // Fallback: Try standard RPC with pre-signed tx (for production)
    console.warn('Admin RPC failed, trying standard RPC:', adminErr)
    
    // For the demo, we'll use a mock submission that works with the local node
    // Replace this with actual signing logic when wallet integration is ready
    const mockSignedTx = btoa(JSON.stringify(txPayload))
    const hash = await sendRawTransaction(mockSignedTx)
    
    return { hash, status: 'pending' }
  }
}

/**
 * Get next nonce for an address
 * Required for transaction ordering and replay protection
 */
async function getNextNonce(address: string): Promise<number> {
  try {
    // Standard Canopy method - replace with actual method name
    const count = await callRPC<number>('canopy_getTransactionCount', [address, 'latest'])
    return count
  } catch {
    // Fallback for demo
    return Math.floor(Date.now() / 1000)
  }
}

// ============================================================================
// TRANSACTION BUILDERS (High-level helpers)
// ============================================================================

export async function registerIdentity(
  address: string,
  displayName: string,
  bio: string,
  avatarUrl?: string
): Promise<{ hash: string; status: string }> {
  return submitTransaction(0x01, {
    address,
    display_name: displayName,
    bio,
    avatar_url: avatarUrl || '',
  }, address)
}

export async function giveEndorsement(
  from: string,
  to: string,
  amount: number,
  message: string
): Promise<{ hash: string; status: string }> {
  return submitTransaction(0x02, { from, to, amount, message }, from)
}

export async function revokeEndorsement(
  from: string,
  to: string
): Promise<{ hash: string; status: string }> {
  return submitTransaction(0x03, { from, to }, from)
}

export async function createAttestation(
  subject: string,
  claim: string,
  evidence?: string,
  creatorAddress?: string
): Promise<{ hash: string; status: string }> {
  return submitTransaction(0x04, {
    subject,
    claim,
    evidence: evidence || '',
  }, creatorAddress || subject)
}

export async function verifyAttestation(
  attestationId: string,
  verifier: string
): Promise<{ hash: string; status: string }> {
  return submitTransaction(0x05, { attestation_id: attestationId, verifier }, verifier)
}

export async function createProposal(
  title: string,
  description: string,
  duration: number,  // seconds
  quorum: number,
  creatorAddress: string
): Promise<{ hash: string; status: string }> {
  return submitTransaction(0x06, { title, description, duration, quorum }, creatorAddress)
}

export async function voteProposal(
  proposalId: string,
  vote: boolean,  // true = yes, false = no
  voterAddress: string
): Promise<{ hash: string; status: string }> {
  return submitTransaction(0x07, { proposal_id: proposalId, vote }, voterAddress)
}

export async function claimBadge(
  badgeId: string,
  user: string
): Promise<{ hash: string; status: string }> {
  return submitTransaction(0x08, { badge_id: badgeId, user }, user)
}

export async function reportUser(
  target: string,
  reason: string,
  evidence: string,
  reporter: string
): Promise<{ hash: string; status: string }> {
  return submitTransaction(0x09, { target, reason, evidence: evidence || '' }, reporter)
}

export async function processReport(
  reportId: string,
  approve: boolean,
  processor: string
): Promise<{ hash: string; status: string }> {
  return submitTransaction(0x0A, { report_id: reportId, approve }, processor)
}

export async function updateReputation(
  address: string
): Promise<{ hash: string; status: string }> {
  return submitTransaction(0x0B, { address }, address)
}

export async function delegateReputation(
  delegator: string,
  delegate: string
): Promise<{ hash: string; status: string }> {
  return submitTransaction(0x0C, { delegator, delegate }, delegator)
}

export async function undelegateReputation(
  delegator: string
): Promise<{ hash: string; status: string }> {
  return submitTransaction(0x0D, { delegator }, delegator)
}

// ============================================================================
// WALLET INTEGRATION HELPERS (For production use)
// ============================================================================

/**
 * Check if wallet is connected and return address
 * In production, integrate with MetaMask, WalletConnect, etc.
 */
export async function connectWallet(): Promise<string> {
  // Check for injected wallet (MetaMask, etc.)
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' })
    return accounts[0]
  }
  
  // Fallback: use local keystore via admin RPC
  try {
    const accounts = await callAdminRPC<string[]>('canopy_listAccounts', [])
    if (accounts.length > 0) return accounts[0]
  } catch {
    // No wallet available
  }
  
  throw new Error('No wallet connected. Please install MetaMask or use the Canopy web wallet.')
}

/**
 * Sign a transaction with the connected wallet
 */
export async function signTransaction(txData: unknown, from: string): Promise<string> {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    // Use injected wallet
    const signed = await (window as any).ethereum.request({
      method: 'eth_signTransaction',
      params: [{ from, data: JSON.stringify(txData) }],
    })
    return signed
  }
  
  // Fallback: use admin RPC for local signing
  return callAdminRPC<string>('canopy_signTransaction', [from, txData])
}

// ============================================================================
// DEBUG / DEV HELPERS
// ============================================================================

/**
 * Check RPC connection health
 */
export async function checkRPCHealth(): Promise<{ rpc: boolean; admin: boolean }> {
  const check = async (url: string) => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'canopy_blockHeight', params: [], id: 1 }),
      })
      return res.ok
    } catch { return false }
  }
  
  return {
    rpc: await check(RPC_URL),
    admin: await check(ADMIN_RPC_URL),
  }
}

/**
 * Get node info for debugging
 */
export async function getNodeInfo(): Promise<unknown> {
  return callRPC('canopy_getNodeInfo', [])
}