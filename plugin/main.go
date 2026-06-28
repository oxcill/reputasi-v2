package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/canopy-network/canopy/pkg"
)

// ============================================================================
// CUSTOM TRANSACTION TYPES
// ============================================================================
// Reputasi v2 defines 13 custom transaction types for the Social-Fi layer:
// 0x01-0x05: Core (Identity, Endorsements, Attestations)
// 0x06-0x07: Governance (Proposals, Voting)
// 0x08:      Soulbound Badges
// 0x09-0x0A: Quality Control (Reports, Slashing)
// 0x0B:      Reputation Recalculation
// 0x0C-0x0D: Delegation System
// ============================================================================

const (
	TxRegisterIdentity     = 0x01
	TxGiveEndorsement      = 0x02
	TxRevokeEndorsement    = 0x03
	TxCreateAttestation    = 0x04
	TxVerifyAttestation    = 0x05
	TxCreateProposal       = 0x06
	TxVoteProposal         = 0x07
	TxClaimBadge           = 0x08
	TxReportUser           = 0x09
	TxProcessReport        = 0x0A
	TxUpdateReputation     = 0x0B
	TxDelegateReputation   = 0x0C
	TxUndelegateReputation = 0x0D
)

// ============================================================================
// PLUGIN STRUCT
// ============================================================================
// ReputasiPlugin implements the Canopy Plugin interface.
// It connects to the Canopy node via the plugin system and registers
// custom transaction handlers and RPC endpoints.
// ============================================================================

type ReputasiPlugin struct {
	state *State
}

// NewPlugin creates a new ReputasiPlugin instance
func NewPlugin() *ReputasiPlugin {
	return &ReputasiPlugin{
		state: NewState(),
	}
}

// ============================================================================
// CANOPY PLUGIN INTERFACE IMPLEMENTATION
// ============================================================================
// These methods are called by the Canopy node when the plugin is loaded.
// They register the plugin's custom functionality with the base chain.
// ============================================================================

// RegisterTxTypes returns a map of custom transaction types to their handlers.
// This is called by the Canopy FSM (Finite State Machine) when processing blocks.
func (p *ReputasiPlugin) RegisterTxTypes() map[byte]pkg.TxHandler {
	return map[byte]pkg.TxHandler{
		TxRegisterIdentity:     p.handleRegisterIdentity,
		TxGiveEndorsement:      p.handleGiveEndorsement,
		TxRevokeEndorsement:    p.handleRevokeEndorsement,
		TxCreateAttestation:    p.handleCreateAttestation,
		TxVerifyAttestation:    p.handleVerifyAttestation,
		TxCreateProposal:       p.handleCreateProposal,
		TxVoteProposal:         p.handleVoteProposal,
		TxClaimBadge:           p.handleClaimBadge,
		TxReportUser:           p.handleReportUser,
		TxProcessReport:        p.handleProcessReport,
		TxUpdateReputation:     p.handleUpdateReputation,
		TxDelegateReputation:   p.handleDelegateReputation,
		TxUndelegateReputation: p.handleUndelegateReputation,
	}
}

// RegisterRPCHandlers registers custom HTTP endpoints on the Canopy RPC server.
// These endpoints are served on port 50002 alongside standard Canopy RPC methods.
// Frontend queries these endpoints to read plugin state.
func (p *ReputasiPlugin) RegisterRPCHandlers(mux *http.ServeMux) {
	// Core identity & reputation
	mux.HandleFunc("/reputasi/identity", p.rpcGetIdentity)
	mux.HandleFunc("/reputasi/endorsements", p.rpcGetEndorsements)
	mux.HandleFunc("/reputasi/attestations", p.rpcGetAttestations)
	mux.HandleFunc("/reputasi/leaderboard", p.rpcGetLeaderboard)
	mux.HandleFunc("/reputasi/reputation", p.rpcGetReputation)
	mux.HandleFunc("/reputasi/search", p.rpcSearchIdentities)

	// Governance
	mux.HandleFunc("/reputasi/badges", p.rpcGetBadges)
	mux.HandleFunc("/reputasi/proposals", p.rpcGetProposals)
	mux.HandleFunc("/reputasi/proposal", p.rpcGetProposal)
	mux.HandleFunc("/reputasi/delegation", p.rpcGetDelegation)
	mux.HandleFunc("/reputasi/reports", p.rpcGetReports)
	mux.HandleFunc("/reputasi/voting-power", p.rpcGetVotingPower)
	mux.HandleFunc("/reputasi/governance-stats", p.rpcGetGovernanceStats)

	log.Println("✅ Reputasi v2 RPC handlers registered on port 50002")
}

// ============================================================================
// PLUGIN ENTRY POINT
// ============================================================================
// main() is the entry point for the plugin binary.
// It creates the plugin instance and connects to the Canopy node.
//
// Usage:
//   ./reputasi-v2-plugin --connect=localhost:50003
//
// The --connect flag specifies the Canopy node's admin RPC port.
// ============================================================================

func main() {
	plugin := NewPlugin()
	log.Println("🌿 Reputasi v2 — Universal Social Layer starting...")
	log.Println("   13 transaction types | 13 RPC endpoints | Quadratic Governance | SBT Badges")

	// pkg.RunPlugin connects to the Canopy node and starts the plugin.
	// It blocks until the plugin is stopped.
	pkg.RunPlugin(plugin)
}

// ============================================================================
// TRANSACTION DATA STRUCTURES
// ============================================================================
// These structs define the payload for each custom transaction type.
// They are serialized to JSON and stored in the transaction data field.
// ============================================================================

// RegisterIdentityTx creates a new onchain social identity
type RegisterIdentityTx struct {
	Address     []byte `json:"address"`
	DisplayName string `json:"display_name"`
	Bio         string `json:"bio"`
	AvatarURL   string `json:"avatar_url,omitempty"`
}

// GiveEndorsementTx stakes tokens to endorse another user
type GiveEndorsementTx struct {
	From    []byte `json:"from"`
	To      []byte `json:"to"`
	Amount  uint64 `json:"amount"`
	Message string `json:"message"`
}

// RevokeEndorsementTx withdraws a previous endorsement
type RevokeEndorsementTx struct {
	From []byte `json:"from"`
	To   []byte `json:"to"`
}

// CreateAttestationTx creates a verifiable claim about a user
type CreateAttestationTx struct {
	Subject  []byte `json:"subject"`
	Claim    string `json:"claim"`
	Evidence string `json:"evidence,omitempty"`
}

// VerifyAttestationTx verifies a pending attestation
type VerifyAttestationTx struct {
	AttestationID []byte `json:"attestation_id"`
	Verifier      []byte `json:"verifier"`
}

// CreateProposalTx creates a governance proposal
type CreateProposalTx struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Duration    uint64 `json:"duration"` // in seconds
	Quorum      uint64 `json:"quorum"`   // minimum voting power needed
}

// VoteProposalTx casts a vote on an active proposal
type VoteProposalTx struct {
	ProposalID []byte `json:"proposal_id"`
	Vote       bool   `json:"vote"` // true = yes, false = no
}

// ClaimBadgeTx claims a soulbound achievement badge
type ClaimBadgeTx struct {
	BadgeID []byte `json:"badge_id"`
	User    []byte `json:"user"`
}

// ReportUserTx reports a user for bad behavior
type ReportUserTx struct {
	Target   []byte `json:"target"`
	Reason   string `json:"reason"`
	Evidence string `json:"evidence,omitempty"`
}

// ProcessReportTx processes a pending report (jury vote)
type ProcessReportTx struct {
	ReportID []byte `json:"report_id"`
	Approve  bool   `json:"approve"` // true = confirm, false = reject
}

// UpdateReputationTx triggers reputation recalculation
type UpdateReputationTx struct {
	Address []byte `json:"address"`
}

// DelegateReputationTx delegates voting power to another user
type DelegateReputationTx struct {
	Delegator []byte `json:"delegator"`
	Delegate  []byte `json:"delegate"`
}

// UndelegateReputationTx removes delegation
type UndelegateReputationTx struct {
	Delegator []byte `json:"delegator"`
}

// ============================================================================
// TRANSACTION HANDLERS
// ============================================================================
// Each handler validates the transaction, updates state, and returns an error
// if validation fails. These are called by the Canopy FSM during block processing.
// ============================================================================

func (p *ReputasiPlugin) handleRegisterIdentity(tx pkg.Transaction) error {
	var data RegisterIdentityTx
	if err := json.Unmarshal(tx.Data, &data); err != nil {
		return fmt.Errorf("invalid tx data: %w", err)
	}

	// Validation
	if len(data.Address) == 0 {
		return fmt.Errorf("address required")
	}
	if len(data.DisplayName) == 0 || len(data.DisplayName) > 32 {
		return fmt.Errorf("display name must be 1-32 characters")
	}
	if len(data.Bio) > 280 {
		return fmt.Errorf("bio max 280 characters")
	}

	// Check if already registered
	existing := p.state.GetIdentity(data.Address)
	if existing.Address != nil {
		return fmt.Errorf("identity already registered")
	}

	// Create identity with base reputation
	identity := Identity{
		Address:     data.Address,
		DisplayName: data.DisplayName,
		Bio:         data.Bio,
		AvatarURL:   data.AvatarURL,
		CreatedAt:   uint64(time.Now().Unix()),
		Reputation:  100, // Base reputation for new users
	}

	p.state.SetIdentity(data.Address, identity)
	p.state.SetBalance(data.Address, 100000) // 100k initial tokens for testing

	// Initialize default badges on first registration
	if len(p.state.GetAllBadges()) == 0 {
		p.state.InitDefaultBadges()
	}

	log.Printf("✅ Identity registered: %s (rep: %d)", data.DisplayName, identity.Reputation)
	return nil
}

func (p *ReputasiPlugin) handleGiveEndorsement(tx pkg.Transaction) error {
	var data GiveEndorsementTx
	if err := json.Unmarshal(tx.Data, &data); err != nil {
		return fmt.Errorf("invalid tx data: %w", err)
	}

	// Validation
	if len(data.From) == 0 || len(data.To) == 0 {
		return fmt.Errorf("from and to addresses required")
	}
	if string(data.From) == string(data.To) {
		return fmt.Errorf("cannot endorse yourself")
	}
	if data.Amount < 10 {
		return fmt.Errorf("minimum endorsement amount is 10")
	}
	if len(data.Message) > 280 {
		return fmt.Errorf("message max 280 characters")
	}

	// Check identities exist
	sender := p.state.GetIdentity(data.From)
	if sender.Address == nil {
		return fmt.Errorf("sender identity not registered")
	}
	recipient := p.state.GetIdentity(data.To)
	if recipient.Address == nil {
		return fmt.Errorf("recipient identity not registered")
	}

	// Check balance
	balance := p.state.GetBalance(data.From)
	if balance < data.Amount {
		return fmt.Errorf("insufficient balance: have %d, need %d", balance, data.Amount)
	}

	// Check if already endorsed
	existing := p.state.GetEndorsement(data.From, data.To)
	if existing != nil && existing.Active {
		return fmt.Errorf("already endorsed this user, revoke first")
	}

	// Deduct stake
	p.state.SetBalance(data.From, balance-data.Amount)

	// Create endorsement
	endorsement := Endorsement{
		From:      data.From,
		To:        data.To,
		Amount:    data.Amount,
		Message:   data.Message,
		CreatedAt: uint64(time.Now().Unix()),
		Active:    true,
	}
	p.state.SetEndorsement(data.From, data.To, endorsement)

	// Update recipient stats
	recipient.EndorsementCount++
	p.state.SetIdentity(data.To, recipient)

	// Boost sender reputation for being active
	sender.Reputation += 5
	if sender.Reputation > 10000 {
		sender.Reputation = 10000
	}
	p.state.SetIdentity(data.From, sender)

	// Recalculate recipient reputation
	p.recalculateReputation(data.To)

	log.Printf("✅ Endorsement: %s → %s (%d tokens)", sender.DisplayName, recipient.DisplayName, data.Amount)
	return nil
}

func (p *ReputasiPlugin) handleRevokeEndorsement(tx pkg.Transaction) error {
	var data RevokeEndorsementTx
	if err := json.Unmarshal(tx.Data, &data); err != nil {
		return fmt.Errorf("invalid tx data: %w", err)
	}

	endorsement := p.state.GetEndorsement(data.From, data.To)
	if endorsement == nil || !endorsement.Active {
		return fmt.Errorf("no active endorsement found")
	}

	// Cooldown check: must wait 7 days
	now := uint64(time.Now().Unix())
	if now-endorsement.CreatedAt < 7*86400 {
		return fmt.Errorf("must wait 7 days before revoking (%.1f days remaining)", 
			float64(7*86400-(now-endorsement.CreatedAt))/86400)
	}

	// Return staked amount with 10% penalty
	refund := endorsement.Amount * 90 / 100
	balance := p.state.GetBalance(data.From)
	p.state.SetBalance(data.From, balance+refund)

	// Mark as revoked
	endorsement.Active = false
	endorsement.RevokedAt = now
	p.state.SetEndorsement(data.From, data.To, *endorsement)

	// Update recipient stats
	recipient := p.state.GetIdentity(data.To)
	if recipient.EndorsementCount > 0 {
		recipient.EndorsementCount--
	}
	p.state.SetIdentity(data.To, recipient)

	// Recalculate reputation
	p.recalculateReputation(data.To)

	log.Printf("✅ Endorsement revoked: %d tokens refunded (10%% penalty)", refund)
	return nil
}

func (p *ReputasiPlugin) handleCreateAttestation(tx pkg.Transaction) error {
	var data CreateAttestationTx
	if err := json.Unmarshal(tx.Data, &data); err != nil {
		return fmt.Errorf("invalid tx data: %w", err)
	}

	if len(data.Subject) == 0 {
		return fmt.Errorf("subject required")
	}
	if len(data.Claim) == 0 || len(data.Claim) > 200 {
		return fmt.Errorf("claim must be 1-200 characters")
	}
	if len(data.Evidence) > 500 {
		return fmt.Errorf("evidence max 500 characters")
	}

	// Check subject exists
	subject := p.state.GetIdentity(data.Subject)
	if subject.Address == nil {
		return fmt.Errorf("subject identity not registered")
	}

	// Generate unique ID
	id := generateID(data.Subject, []byte(data.Claim), tx.Sender)

	attestation := Attestation{
		ID:        id,
		Subject:   data.Subject,
		Claim:     data.Claim,
		Evidence:  data.Evidence,
		CreatedBy: tx.Sender,
		CreatedAt: uint64(time.Now().Unix()),
		Verifiers: [][]byte{},
		Confirmed: false,
	}

	p.state.SetAttestation(id, attestation)

	// Update subject attestation count
	subject.AttestationCount++
	p.state.SetIdentity(data.Subject, subject)

	log.Printf("✅ Attestation created: %s", data.Claim)
	return nil
}

func (p *ReputasiPlugin) handleVerifyAttestation(tx pkg.Transaction) error {
	var data VerifyAttestationTx
	if err := json.Unmarshal(tx.Data, &data); err != nil {
		return fmt.Errorf("invalid tx data: %w", err)
	}

	attestation := p.state.GetAttestation(data.AttestationID)
	if attestation == nil {
		return fmt.Errorf("attestation not found")
	}
	if attestation.Confirmed {
		return fmt.Errorf("attestation already confirmed")
	}

	// Check verifier identity and minimum reputation
	verifier := p.state.GetIdentity(data.Verifier)
	if verifier.Address == nil {
		return fmt.Errorf("verifier identity not registered")
	}
	if verifier.Reputation < 300 {
		return fmt.Errorf("verifier needs minimum 300 reputation, has %d", verifier.Reputation)
	}

	// Check not already verified
	for _, v := range attestation.Verifiers {
		if string(v) == string(data.Verifier) {
			return fmt.Errorf("already verified by this user")
		}
	}

	// Add verifier
	attestation.Verifiers = append(attestation.Verifiers, data.Verifier)
	attestation.VerifierCount++

	// Confirm if threshold reached (3 verifiers)
	if attestation.VerifierCount >= 3 {
		attestation.Confirmed = true

		// Boost subject's reputation
		p.recalculateReputation(attestation.Subject)

		// Reward verifiers
		for _, v := range attestation.Verifiers {
			vIdentity := p.state.GetIdentity(v)
			vIdentity.Reputation += 10
			if vIdentity.Reputation > 10000 {
				vIdentity.Reputation = 10000
			}
			p.state.SetIdentity(v, vIdentity)
		}

		log.Printf("✅ Attestation confirmed! Subject reputation updated")
	}

	p.state.SetAttestation(data.AttestationID, *attestation)
	return nil
}