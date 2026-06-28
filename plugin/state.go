package main

import (
	"bytes"
	"crypto/sha256"
	"math"
	"sort"
	"sync"
	"time"
)

// Identity represents an onchain social identity
type Identity struct {
	Address          []byte `json:"address"`
	DisplayName      string `json:"display_name"`
	Bio              string `json:"bio"`
	AvatarURL        string `json:"avatar_url"`
	CreatedAt        uint64 `json:"created_at"`
	Reputation       uint64 `json:"reputation"`
	EndorsementCount uint64 `json:"endorsement_count"`
	AttestationCount uint64 `json:"attestation_count"`
	BadgeCount       uint64 `json:"badge_count"`
	ProposalCount    uint64 `json:"proposal_count"`
	VoteCount        uint64 `json:"vote_count"`
	ReportCount      uint64 `json:"report_count"`
	SlashedAmount    uint64 `json:"slashed_amount"`
	DelegatedTo      []byte `json:"delegated_to,omitempty"`
	DelegatedFrom    [][]byte `json:"delegated_from,omitempty"`
}

// Endorsement represents a staked endorsement between users
type Endorsement struct {
	From      []byte `json:"from"`
	To        []byte `json:"to"`
	Amount    uint64 `json:"amount"`
	Message   string `json:"message"`
	CreatedAt uint64 `json:"created_at"`
	RevokedAt uint64 `json:"revoked_at,omitempty"`
	Active    bool   `json:"active"`
}

// Attestation represents a verifiable claim about a user
type Attestation struct {
	ID            []byte   `json:"id"`
	Subject       []byte   `json:"subject"`
	Claim         string   `json:"claim"`
	Evidence      string   `json:"evidence"`
	CreatedBy     []byte   `json:"created_by"`
	CreatedAt     uint64   `json:"created_at"`
	Verifiers     [][]byte `json:"verifiers"`
	VerifierCount uint64   `json:"verifier_count"`
	Confirmed     bool     `json:"confirmed"`
}

// Proposal represents a governance proposal
type Proposal struct {
	ID          []byte   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	CreatedBy   []byte   `json:"created_by"`
	CreatedAt   uint64   `json:"created_at"`
	EndsAt      uint64   `json:"ends_at"`
	Status      string   `json:"status"` // "active", "passed", "rejected", "executed"
	YesVotes    uint64   `json:"yes_votes"`
	NoVotes     uint64   `json:"no_votes"`
	TotalPower  uint64   `json:"total_power"`
	Voters      [][]byte `json:"voters"`
	Quorum      uint64   `json:"quorum"` // minimum votes needed
}

// Badge represents a soulbound achievement NFT
type Badge struct {
	ID          []byte `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	ImageURL    string `json:"image_url"`
	MinReputation uint64 `json:"min_reputation"`
	MinEndorsements uint64 `json:"min_endorsements"`
	MinAttestations uint64 `json:"min_attestations"`
	MinAgeDays    uint64 `json:"min_age_days"`
	Color       string `json:"color"`
}

// UserBadge represents a claimed badge
type UserBadge struct {
	BadgeID   []byte `json:"badge_id"`
	User      []byte `json:"user"`
	ClaimedAt uint64 `json:"claimed_at"`
}

// Report represents a community report against a user
type Report struct {
	ID        []byte   `json:"id"`
	Target    []byte   `json:"target"`
	Reporter  []byte   `json:"reporter"`
	Reason    string   `json:"reason"`
	Evidence  string   `json:"evidence"`
	CreatedAt uint64   `json:"created_at"`
	Status    string   `json:"status"` // "pending", "confirmed", "rejected"
	Votes     uint64   `json:"votes"`
	Voters    [][]byte `json:"voters"`
}

// State manages all onchain data
type State struct {
	mu           sync.RWMutex
	identities   map[string]Identity
	endorsements map[string]Endorsement // key: "from|to"
	attestations map[string]Attestation // key: hex(id)
	proposals    map[string]Proposal
	badges       map[string]Badge
	userBadges   map[string][]UserBadge // key: user address
	reports      map[string]Report
	balances     map[string]uint64
}

func NewState() *State {
	return &State{
		identities:   make(map[string]Identity),
		endorsements: make(map[string]Endorsement),
		attestations: make(map[string]Attestation),
		proposals:    make(map[string]Proposal),
		badges:       make(map[string]Badge),
		userBadges:   make(map[string][]UserBadge),
		reports:      make(map[string]Report),
		balances:     make(map[string]uint64),
	}
}

func (s *State) key(addr []byte) string {
	return string(addr)
}

func (s *State) endorsementKey(from, to []byte) string {
	return string(from) + "|" + string(to)
}

// Identity methods
func (s *State) SetIdentity(addr []byte, identity Identity) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.identities[s.key(addr)] = identity
}

func (s *State) GetIdentity(addr []byte) Identity {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if id, ok := s.identities[s.key(addr)]; ok {
		return id
	}
	return Identity{}
}

func (s *State) GetAllIdentities() []Identity {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []Identity
	for _, id := range s.identities {
		result = append(result, id)
	}
	return result
}

// Endorsement methods
func (s *State) SetEndorsement(from, to []byte, e Endorsement) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.endorsements[s.endorsementKey(from, to)] = e
}

func (s *State) GetEndorsement(from, to []byte) *Endorsement {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if e, ok := s.endorsements[s.endorsementKey(from, to)]; ok {
		return &e
	}
	return nil
}

func (s *State) GetEndorsementsFrom(addr []byte) []Endorsement {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []Endorsement
	for k, e := range s.endorsements {
		if bytes.HasPrefix([]byte(k), addr) && e.Active {
			result = append(result, e)
		}
	}
	return result
}

func (s *State) GetEndorsementsTo(addr []byte) []Endorsement {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []Endorsement
	for _, e := range s.endorsements {
		if bytes.Equal(e.To, addr) && e.Active {
			result = append(result, e)
		}
	}
	return result
}

// Attestation methods
func (s *State) SetAttestation(id []byte, a Attestation) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.attestations[s.key(id)] = a
}

func (s *State) GetAttestation(id []byte) *Attestation {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if a, ok := s.attestations[s.key(id)]; ok {
		return &a
	}
	return nil
}

func (s *State) GetAttestationsFor(addr []byte) []Attestation {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []Attestation
	for _, a := range s.attestations {
		if bytes.Equal(a.Subject, addr) {
			result = append(result, a)
		}
	}
	return result
}

func (s *State) GetAllAttestations() []Attestation {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []Attestation
	for _, a := range s.attestations {
		result = append(result, a)
	}
	return result
}

// Proposal methods
func (s *State) SetProposal(id []byte, p Proposal) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.proposals[s.key(id)] = p
}

func (s *State) GetProposal(id []byte) *Proposal {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if p, ok := s.proposals[s.key(id)]; ok {
		return &p
	}
	return nil
}

func (s *State) GetAllProposals() []Proposal {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []Proposal
	for _, p := range s.proposals {
		result = append(result, p)
	}
	// Sort by created_at descending
	sort.Slice(result, func(i, j int) bool {
		return result[i].CreatedAt > result[j].CreatedAt
	})
	return result
}

func (s *State) GetActiveProposals() []Proposal {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []Proposal
	now := uint64(time.Now().Unix())
	for _, p := range s.proposals {
		if p.Status == "active" && p.EndsAt > now {
			result = append(result, p)
		}
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].CreatedAt > result[j].CreatedAt
	})
	return result
}

// Badge methods
func (s *State) SetBadge(id []byte, b Badge) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.badges[s.key(id)] = b
}

func (s *State) GetBadge(id []byte) *Badge {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if b, ok := s.badges[s.key(id)]; ok {
		return &b
	}
	return nil
}

func (s *State) GetAllBadges() []Badge {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []Badge
	for _, b := range s.badges {
		result = append(result, b)
	}
	return result
}

func (s *State) AddUserBadge(user []byte, ub UserBadge) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.userBadges[s.key(user)] = append(s.userBadges[s.key(user)], ub)
}

func (s *State) GetUserBadges(user []byte) []UserBadge {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.userBadges[s.key(user)]
}

// Report methods
func (s *State) SetReport(id []byte, r Report) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.reports[s.key(id)] = r
}

func (s *State) GetReport(id []byte) *Report {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if r, ok := s.reports[s.key(id)]; ok {
		return &r
	}
	return nil
}

func (s *State) GetReportsFor(target []byte) []Report {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []Report
	for _, r := range s.reports {
		if bytes.Equal(r.Target, target) {
			result = append(result, r)
		}
	}
	return result
}

func (s *State) GetPendingReports() []Report {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []Report
	for _, r := range s.reports {
		if r.Status == "pending" {
			result = append(result, r)
		}
	}
	return result
}

// Balance methods
func (s *State) GetBalance(addr []byte) uint64 {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.balances[s.key(addr)]
}

func (s *State) SetBalance(addr []byte, amount uint64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.balances[s.key(addr)] = amount
}

// Leaderboard
func (s *State) GetLeaderboard(limit int) []Identity {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	var all []Identity
	for _, id := range s.identities {
		all = append(all, id)
	}
	
	sort.Slice(all, func(i, j int) bool {
		return all[i].Reputation > all[j].Reputation
	})
	
	if limit > len(all) {
		limit = len(all)
	}
	return all[:limit]
}

// Get voting power (quadratic: sqrt of reputation)
func (s *State) GetVotingPower(addr []byte) uint64 {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	identity := s.identities[s.key(addr)]
	if identity.Address == nil {
		return 0
	}
	
	// Base voting power = sqrt(reputation)
	power := uint64(math.Sqrt(float64(identity.Reputation)))
	
	// Add delegated power
	for _, delegator := range identity.DelegatedFrom {
		delegatorIdentity := s.identities[s.key(delegator)]
		if delegatorIdentity.Address != nil {
			power += uint64(math.Sqrt(float64(delegatorIdentity.Reputation)))
		}
	}
	
	// Subtract if delegated to someone else
	if identity.DelegatedTo != nil {
		power = 0 // Can't vote if delegated
	}
	
	return power
}

// Generate unique ID
func generateID(parts ...[]byte) []byte {
	h := sha256.New()
	for _, p := range parts {
		h.Write(p)
	}
	h.Write([]byte(time.Now().String()))
	return h.Sum(nil)
}

// Initialize default badges
func (s *State) InitDefaultBadges() {
	badges := []Badge{
		{
			ID:              generateID([]byte("seedling")),
			Name:            "🌱 Seedling",
			Description:     "Welcome to the community! Registered your onchain identity.",
			MinReputation:   100,
			MinEndorsements: 0,
			MinAttestations: 0,
			MinAgeDays:      0,
			Color:           "#22c55e",
		},
		{
			ID:              generateID([]byte("sprout")),
			Name:            "🌿 Sprout",
			Description:     "Growing trust. Earned 500 reputation points.",
			MinReputation:   500,
			MinEndorsements: 2,
			MinAttestations: 0,
			MinAgeDays:      7,
			Color:           "#16a34a",
		},
		{
			ID:              generateID([]byte("guardian")),
			Name:            "🛡️ Guardian",
			Description:     "Community protector. Verified 5 attestations.",
			MinReputation:   1000,
			MinEndorsements: 5,
			MinAttestations: 0,
			MinAgeDays:      14,
			Color:           "#2563eb",
		},
		{
			ID:              generateID([]byte("elder")),
			Name:            "👑 Elder",
			Description:     "Respected elder. 3000+ reputation and 30 days active.",
			MinReputation:   3000,
			MinEndorsements: 10,
			MinAttestations: 3,
			MinAgeDays:      30,
			Color:           "#9333ea",
		},
		{
			ID:              generateID([]byte("legend")),
			Name:            "🔥 Legend",
			Description:     "Onchain legend. 5000+ reputation, community pillar.",
			MinReputation:   5000,
			MinEndorsements: 25,
			MinAttestations: 10,
			MinAgeDays:      60,
			Color:           "#dc2626",
		},
	}
	
	for _, b := range badges {
		s.SetBadge(b.ID, b)
	}
}