package main

import (
	"encoding/json"
	"fmt"
	"math"
	"time"

	"github.com/canopy-network/canopy/pkg"
)

// ========== IDENTITY ==========
type RegisterIdentityTx struct {
	Address     []byte `json:"address"`
	DisplayName string `json:"display_name"`
	Bio         string `json:"bio"`
	AvatarURL   string `json:"avatar_url,omitempty"`
}

func (p *ReputasiPlugin) handleRegisterIdentity(tx pkg.Transaction) error {
	var data RegisterIdentityTx
	if err := json.Unmarshal(tx.Data, &data); err != nil {
		return fmt.Errorf("invalid tx data: %w", err)
	}

	if len(data.Address) == 0 {
		return fmt.Errorf("address required")
	}
	if len(data.DisplayName) == 0 || len(data.DisplayName) > 32 {
		return fmt.Errorf("display name must be 1-32 characters")
	}
	if len(data.Bio) > 280 {
		return fmt.Errorf("bio max 280 characters")
	}

	existing := p.state.GetIdentity(data.Address)
	if existing.Address != nil {
		return fmt.Errorf("identity already registered")
	}

	identity := Identity{
		Address:     data.Address,
		DisplayName: data.DisplayName,
		Bio:         data.Bio,
		AvatarURL:   data.AvatarURL,
		CreatedAt:   uint64(time.Now().Unix()),
		Reputation:  100,
	}

	p.state.SetIdentity(data.Address, identity)
	p.state.SetBalance(data.Address, 100000) // 100k initial for testing
	
	// Initialize badges on first registration
	if len(p.state.GetAllBadges()) == 0 {
		p.state.InitDefaultBadges()
	}
	
	return nil
}

// ========== ENDORSEMENTS ==========
type GiveEndorsementTx struct {
	From    []byte `json:"from"`
	To      []byte `json:"to"`
	Amount  uint64 `json:"amount"`
	Message string `json:"message"`
}

func (p *ReputasiPlugin) handleGiveEndorsement(tx pkg.Transaction) error {
	var data GiveEndorsementTx
	if err := json.Unmarshal(tx.Data, &data); err != nil {
		return fmt.Errorf("invalid tx data: %w", err)
	}

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

	sender := p.state.GetIdentity(data.From)
	if sender.Address == nil {
		return fmt.Errorf("sender identity not registered")
	}
	recipient := p.state.GetIdentity(data.To)
	if recipient.Address == nil {
		return fmt.Errorf("recipient identity not registered")
	}

	balance := p.state.GetBalance(data.From)
	if balance < data.Amount {
		return fmt.Errorf("insufficient balance: have %d, need %d", balance, data.Amount)
	}

	existing := p.state.GetEndorsement(data.From, data.To)
	if existing != nil && existing.Active {
		return fmt.Errorf("already endorsed this user, revoke first")
	}

	p.state.SetBalance(data.From, balance-data.Amount)

	endorsement := Endorsement{
		From:      data.From,
		To:        data.To,
		Amount:    data.Amount,
		Message:   data.Message,
		CreatedAt: uint64(time.Now().Unix()),
		Active:    true,
	}

	p.state.SetEndorsement(data.From, data.To, endorsement)

	recipient.EndorsementCount++
	p.state.SetIdentity(data.To, recipient)

	sender.Reputation += 5
	if sender.Reputation > 10000 {
		sender.Reputation = 10000
	}
	p.state.SetIdentity(data.From, sender)

	p.recalculateReputation(data.To)
	return nil
}

type RevokeEndorsementTx struct {
	From []byte `json:"from"`
	To   []byte `json:"to"`
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

	now := uint64(time.Now().Unix())
	if now-endorsement.CreatedAt < 7*86400 {
		return fmt.Errorf("must wait 7 days before revoking")
	}

	refund := endorsement.Amount * 90 / 100
	balance := p.state.GetBalance(data.From)
	p.state.SetBalance(data.From, balance+refund)

	endorsement.Active = false
	endorsement.RevokedAt = now
	p.state.SetEndorsement(data.From, data.To, *endorsement)

	recipient := p.state.GetIdentity(data.To)
	if recipient.EndorsementCount > 0 {
		recipient.EndorsementCount--
	}
	p.state.SetIdentity(data.To, recipient)

	p.recalculateReputation(data.To)
	return nil
}

// ========== ATTESTATIONS ==========
type CreateAttestationTx struct {
	Subject  []byte `json:"subject"`
	Claim    string `json:"claim"`
	Evidence string `json:"evidence,omitempty"`
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

	subject := p.state.GetIdentity(data.Subject)
	if subject.Address == nil {
		return fmt.Errorf("subject identity not registered")
	}

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

	subject.AttestationCount++
	p.state.SetIdentity(data.Subject, subject)

	return nil
}

type VerifyAttestationTx struct {
	AttestationID []byte `json:"attestation_id"`
	Verifier      []byte `json:"verifier"`
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

	verifier := p.state.GetIdentity(data.Verifier)
	if verifier.Address == nil {
		return fmt.Errorf("verifier identity not registered")
	}
	if verifier.Reputation < 300 {
		return fmt.Errorf("verifier needs minimum 300 reputation, has %d", verifier.Reputation)
	}

	for _, v := range attestation.Verifiers {
		if string(v) == string(data.Verifier) {
			return fmt.Errorf("already verified by this user")
		}
	}

	attestation.Verifiers = append(attestation.Verifiers, data.Verifier)
	attestation.VerifierCount++

	if attestation.VerifierCount >= 3 {
		attestation.Confirmed = true
		p.recalculateReputation(attestation.Subject)

		for _, v := range attestation.Verifiers {
			vIdentity := p.state.GetIdentity(v)
			vIdentity.Reputation += 10
			if vIdentity.Reputation > 10000 {
				vIdentity.Reputation = 10000
			}
			p.state.SetIdentity(v, vIdentity)
		}
	}

	p.state.SetAttestation(data.AttestationID, *attestation)
	return nil
}

// ========== GOVERNANCE ==========
type CreateProposalTx struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Duration    uint64 `json:"duration"` // in seconds
	Quorum      uint64 `json:"quorum"`   // minimum votes needed
}

func (p *ReputasiPlugin) handleCreateProposal(tx pkg.Transaction) error {
	var data CreateProposalTx
	if err := json.Unmarshal(tx.Data, &data); err != nil {
		return fmt.Errorf("invalid tx data: %w", err)
	}

	if len(data.Title) == 0 || len(data.Title) > 100 {
		return fmt.Errorf("title must be 1-100 characters")
	}
	if len(data.Description) == 0 || len(data.Description) > 2000 {
		return fmt.Errorf("description max 2000 characters")
	}
	if data.Duration < 86400 || data.Duration > 30*86400 {
		return fmt.Errorf("duration must be between 1-30 days")
	}

	creator := p.state.GetIdentity(tx.Sender)
	if creator.Address == nil {
		return fmt.Errorf("creator identity not registered")
	}
	if creator.Reputation < 500 {
		return fmt.Errorf("need minimum 500 reputation to create proposal")
	}

	id := generateID(tx.Sender, []byte(data.Title))
	now := uint64(time.Now().Unix())

	proposal := Proposal{
		ID:          id,
		Title:       data.Title,
		Description: data.Description,
		CreatedBy:   tx.Sender,
		CreatedAt:   now,
		EndsAt:      now + data.Duration,
		Status:      "active",
		YesVotes:    0,
		NoVotes:     0,
		TotalPower:  0,
		Voters:      [][]byte{},
		Quorum:      data.Quorum,
	}

	p.state.SetProposal(id, proposal)

	creator.ProposalCount++
	p.state.SetIdentity(tx.Sender, creator)

	return nil
}

type VoteProposalTx struct {
	ProposalID []byte `json:"proposal_id"`
	Vote       bool   `json:"vote"` // true = yes, false = no
}

func (p *ReputasiPlugin) handleVoteProposal(tx pkg.Transaction) error {
	var data VoteProposalTx
	if err := json.Unmarshal(tx.Data, &data); err != nil {
		return fmt.Errorf("invalid tx data: %w", err)
	}

	proposal := p.state.GetProposal(data.ProposalID)
	if proposal == nil {
		return fmt.Errorf("proposal not found")
	}
	if proposal.Status != "active" {
		return fmt.Errorf("proposal is not active")
	}
	if uint64(time.Now().Unix()) > proposal.EndsAt {
		return fmt.Errorf("voting period has ended")
	}

	// Check if already voted
	for _, v := range proposal.Voters {
		if string(v) == string(tx.Sender) {
			return fmt.Errorf("already voted")
		}
	}

	// Get voting power (quadratic)
	votingPower := p.state.GetVotingPower(tx.Sender)
	if votingPower == 0 {
		return fmt.Errorf("no voting power")
	}

	voter := p.state.GetIdentity(tx.Sender)
	if voter.Address == nil {
		return fmt.Errorf("voter identity not registered")
	}

	proposal.Voters = append(proposal.Voters, tx.Sender)
	proposal.TotalPower += votingPower

	if data.Vote {
		proposal.YesVotes += votingPower
	} else {
		proposal.NoVotes += votingPower
	}

	// Check if quorum reached and voting ended
	if uint64(time.Now().Unix()) >= proposal.EndsAt || proposal.TotalPower >= proposal.Quorum {
		if proposal.YesVotes > proposal.NoVotes {
			proposal.Status = "passed"
		} else {
			proposal.Status = "rejected"
		}
	}

	p.state.SetProposal(data.ProposalID, *proposal)

	voter.VoteCount++
	p.state.SetIdentity(tx.Sender, voter)

	return nil
}

// ========== BADGES (Soulbound) ==========
type ClaimBadgeTx struct {
	BadgeID []byte `json:"badge_id"`
	User    []byte `json:"user"`
}

func (p *ReputasiPlugin) handleClaimBadge(tx pkg.Transaction) error {
	var data ClaimBadgeTx
	if err := json.Unmarshal(tx.Data, &data); err != nil {
		return fmt.Errorf("invalid tx data: %w", err)
	}

	badge := p.state.GetBadge(data.BadgeID)
	if badge == nil {
		return fmt.Errorf("badge not found")
	}

	identity := p.state.GetIdentity(data.User)
	if identity.Address == nil {
		return fmt.Errorf("identity not registered")
	}

	// Check if already claimed
	existing := p.state.GetUserBadges(data.User)
	for _, ub := range existing {
		if string(ub.BadgeID) == string(data.BadgeID) {
			return fmt.Errorf("badge already claimed")
		}
	}

	// Check requirements
	age := (uint64(time.Now().Unix()) - identity.CreatedAt) / 86400
	if identity.Reputation < badge.MinReputation {
		return fmt.Errorf("need %d reputation, have %d", badge.MinReputation, identity.Reputation)
	}
	if identity.EndorsementCount < badge.MinEndorsements {
		return fmt.Errorf("need %d endorsements, have %d", badge.MinEndorsements, identity.EndorsementCount)
	}
	if identity.AttestationCount < badge.MinAttestations {
		return fmt.Errorf("need %d attestations, have %d", badge.MinAttestations, identity.AttestationCount)
	}
	if age < badge.MinAgeDays {
		return fmt.Errorf("need %d days, have %d", badge.MinAgeDays, age)
	}

	userBadge := UserBadge{
		BadgeID:   data.BadgeID,
		User:      data.User,
		ClaimedAt: uint64(time.Now().Unix()),
	}

	p.state.AddUserBadge(data.User, userBadge)

	identity.BadgeCount++
	identity.Reputation += 50 // Bonus for claiming badge
	if identity.Reputation > 10000 {
		identity.Reputation = 10000
	}
	p.state.SetIdentity(data.User, identity)

	return nil
}

// ========== REPORTS (Slashing DAO) ==========
type ReportUserTx struct {
	Target   []byte `json:"target"`
	Reason   string `json:"reason"`
	Evidence string `json:"evidence"`
}

func (p *ReputasiPlugin) handleReportUser(tx pkg.Transaction) error {
	var data ReportUserTx
	if err := json.Unmarshal(tx.Data, &data); err != nil {
		return fmt.Errorf("invalid tx data: %w", err)
	}

	if string(tx.Sender) == string(data.Target) {
		return fmt.Errorf("cannot report yourself")
	}
	if len(data.Reason) == 0 || len(data.Reason) > 500 {
		return fmt.Errorf("reason must be 1-500 characters")
	}

	reporter := p.state.GetIdentity(tx.Sender)
	if reporter.Address == nil {
		return fmt.Errorf("reporter not registered")
	}
	if reporter.Reputation < 500 {
		return fmt.Errorf("need 500+ reputation to report")
	}

	target := p.state.GetIdentity(data.Target)
	if target.Address == nil {
		return fmt.Errorf("target not registered")
	}

	id := generateID(tx.Sender, data.Target, []byte(data.Reason))

	report := Report{
		ID:        id,
		Target:    data.Target,
		Reporter:  tx.Sender,
		Reason:    data.Reason,
		Evidence:  data.Evidence,
		CreatedAt: uint64(time.Now().Unix()),
		Status:    "pending",
		Votes:     0,
		Voters:    [][]byte{},
	}

	p.state.SetReport(id, report)

	reporter.ReportCount++
	p.state.SetIdentity(tx.Sender, reporter)

	return nil
}

type ProcessReportTx struct {
	ReportID []byte `json:"report_id"`
	Approve  bool   `json:"approve"` // true = confirm report, false = reject
}

func (p *ReputasiPlugin) handleProcessReport(tx pkg.Transaction) error {
	var data ProcessReportTx
	if err := json.Unmarshal(tx.Data, &data); err != nil {
		return fmt.Errorf("invalid tx data: %w", err)
	}

	report := p.state.GetReport(data.ReportID)
	if report == nil {
		return fmt.Errorf("report not found")
	}
	if report.Status != "pending" {
		return fmt.Errorf("report already processed")
	}

	// Check if voter is high-reputation
	voter := p.state.GetIdentity(tx.Sender)
	if voter.Address == nil {
		return fmt.Errorf("voter not registered")
	}
	if voter.Reputation < 1000 {
		return fmt.Errorf("need 1000+ reputation to process reports")
	}

	// Check if already voted
	for _, v := range report.Voters {
		if string(v) == string(tx.Sender) {
			return fmt.Errorf("already voted on this report")
		}
	}

	report.Voters = append(report.Voters, tx.Sender)
	report.Votes += uint64(math.Sqrt(float64(voter.Reputation)))

	// Need 5 high-rep voters or total voting power >= 100
	if len(report.Voters) >= 5 || report.Votes >= 100 {
		if data.Approve {
			report.Status = "confirmed"
			// Slash target's reputation by 50%
			target := p.state.GetIdentity(report.Target)
			if target.Address != nil {
				slashed := target.Reputation / 2
				target.Reputation -= slashed
				target.SlashedAmount += slashed
				p.state.SetIdentity(report.Target, target)
			}
		} else {
			report.Status = "rejected"
		}
	}

	p.state.SetReport(data.ReportID, *report)
	return nil
}

// ========== DELEGATION ==========
type DelegateReputationTx struct {
	Delegator []byte `json:"delegator"`
	Delegate  []byte `json:"delegate"`
}

func (p *ReputasiPlugin) handleDelegateReputation(tx pkg.Transaction) error {
	var data DelegateReputationTx
	if err := json.Unmarshal(tx.Data, &data); err != nil {
		return fmt.Errorf("invalid tx data: %w", err)
	}

	if string(data.Delegator) == string(data.Delegate) {
		return fmt.Errorf("cannot delegate to yourself")
	}

	delegator := p.state.GetIdentity(data.Delegator)
	if delegator.Address == nil {
		return fmt.Errorf("delegator not registered")
	}
	if delegator.DelegatedTo != nil {
		return fmt.Errorf("already delegated, undelegate first")
	}

	delegate := p.state.GetIdentity(data.Delegate)
	if delegate.Address == nil {
		return fmt.Errorf("delegate not registered")
	}
	if delegate.Reputation < 1000 {
		return fmt.Errorf("delegate needs 1000+ reputation")
	}

	delegator.DelegatedTo = data.Delegate
	delegate.DelegatedFrom = append(delegate.DelegatedFrom, data.Delegator)

	p.state.SetIdentity(data.Delegator, delegator)
	p.state.SetIdentity(data.Delegate, delegate)

	return nil
}

type UndelegateReputationTx struct {
	Delegator []byte `json:"delegator"`
}

func (p *ReputasiPlugin) handleUndelegateReputation(tx pkg.Transaction) error {
	var data UndelegateReputationTx
	if err := json.Unmarshal(tx.Data, &data); err != nil {
		return fmt.Errorf("invalid tx data: %w", err)
	}

	delegator := p.state.GetIdentity(data.Delegator)
	if delegator.Address == nil {
		return fmt.Errorf("delegator not registered")
	}
	if delegator.DelegatedTo == nil {
		return fmt.Errorf("not currently delegated")
	}

	// Remove from delegate's list
	delegate := p.state.GetIdentity(delegator.DelegatedTo)
	if delegate.Address != nil {
		var newFrom [][]byte
		for _, d := range delegate.DelegatedFrom {
			if string(d) != string(data.Delegator) {
				newFrom = append(newFrom, d)
			}
		}
		delegate.DelegatedFrom = newFrom
		p.state.SetIdentity(delegator.DelegatedTo, delegate)
	}

	delegator.DelegatedTo = nil
	p.state.SetIdentity(data.Delegator, delegator)

	return nil
}

// ========== UPDATE REPUTATION ==========
type UpdateReputationTx struct {
	Address []byte `json:"address"`
}

func (p *ReputasiPlugin) handleUpdateReputation(tx pkg.Transaction) error {
	var data UpdateReputationTx
	if err := json.Unmarshal(tx.Data, &data); err != nil {
		return fmt.Errorf("invalid tx data: %w", err)
	}

	identity := p.state.GetIdentity(data.Address)
	if identity.Address == nil {
		return fmt.Errorf("identity not found")
	}

	p.recalculateReputation(data.Address)
	return nil
}

// ========== REPUTATION ALGORITHM ==========
func (p *ReputasiPlugin) recalculateReputation(address []byte) {
	identity := p.state.GetIdentity(address)
	if identity.Address == nil {
		return
	}

	now := uint64(time.Now().Unix())
	var newReputation uint64 = 100

	// Endorsement score
	endorsements := p.state.GetEndorsementsTo(address)
	for _, e := range endorsements {
		if e.Active {
			amount := e.Amount
			logVal := uint64(0)
			for amount > 0 {
				amount /= 10
				logVal++
			}
			if logVal > 0 {
				newReputation += 10 * logVal
			}
		}
	}

	// Attestation score
	attestations := p.state.GetAttestationsFor(address)
	for _, a := range attestations {
		if a.Confirmed {
			newReputation += 75
		} else {
			newReputation += 10
		}
	}

	// Age bonus
	age := (now - identity.CreatedAt) / 86400
	ageBonus := age * 2
	if ageBonus > 200 {
		ageBonus = 200
	}
	newReputation += ageBonus

	// Activity bonus
	given := p.state.GetEndorsementsFrom(address)
	activityBonus := uint64(len(given)) * 5
	if activityBonus > 100 {
		activityBonus = 100
	}
	newReputation += activityBonus

	// Governance bonus
	newReputation += identity.VoteCount * 3
	newReputation += identity.ProposalCount * 10

	// Badge bonus
	newReputation += identity.BadgeCount * 50

	// Slashing penalty
	if identity.SlashedAmount > 0 {
		penalty := identity.SlashedAmount / 10
		if penalty > newReputation/2 {
			penalty = newReputation / 2
		}
		newReputation -= penalty
	}

	if newReputation > 10000 {
		newReputation = 10000
	}

	identity.Reputation = newReputation
	p.state.SetIdentity(address, identity)
}