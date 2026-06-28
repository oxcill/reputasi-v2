package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func jsonResponse(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func errorResponse(w http.ResponseWriter, status int, msg string) {
	w.WriteHeader(status)
	jsonResponse(w, map[string]string{"error": msg})
}

func (p *ReputasiPlugin) rpcGetIdentity(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		errorResponse(w, http.StatusBadRequest, "address parameter required")
		return
	}
	identity := p.state.GetIdentity([]byte(address))
	if identity.Address == nil {
		errorResponse(w, http.StatusNotFound, "identity not found")
		return
	}
	jsonResponse(w, identity)
}

func (p *ReputasiPlugin) rpcGetEndorsements(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	direction := r.URL.Query().Get("direction")
	if address == "" {
		errorResponse(w, http.StatusBadRequest, "address parameter required")
		return
	}
	var endorsements []Endorsement
	if direction == "given" {
		endorsements = p.state.GetEndorsementsFrom([]byte(address))
	} else {
		endorsements = p.state.GetEndorsementsTo([]byte(address))
	}
	jsonResponse(w, map[string]interface{}{
		"address": address, "direction": direction,
		"count": len(endorsements), "endorsements": endorsements,
	})
}

func (p *ReputasiPlugin) rpcGetAttestations(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	status := r.URL.Query().Get("status")
	if address == "" {
		errorResponse(w, http.StatusBadRequest, "address parameter required")
		return
	}
	attestations := p.state.GetAttestationsFor([]byte(address))
	var filtered []Attestation
	for _, a := range attestations {
		switch status {
		case "confirmed":
			if a.Confirmed { filtered = append(filtered, a) }
		case "pending":
			if !a.Confirmed { filtered = append(filtered, a) }
		default:
			filtered = append(filtered, a)
		}
	}
	jsonResponse(w, map[string]interface{}{
		"address": address, "status": status,
		"count": len(filtered), "attestations": filtered,
	})
}

func (p *ReputasiPlugin) rpcGetLeaderboard(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	limit := 50
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 { limit = l }
	}
	leaderboard := p.state.GetLeaderboard(limit)
	jsonResponse(w, map[string]interface{}{
		"limit": limit, "count": len(leaderboard),
		"leaderboard": leaderboard, "timestamp": time.Now().Unix(),
	})
}

func (p *ReputasiPlugin) rpcGetReputation(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		errorResponse(w, http.StatusBadRequest, "address parameter required")
		return
	}
	identity := p.state.GetIdentity([]byte(address))
	if identity.Address == nil {
		errorResponse(w, http.StatusNotFound, "identity not found")
		return
	}
	now := uint64(time.Now().Unix())
	age := (now - identity.CreatedAt) / 86400
	
	endorsements := p.state.GetEndorsementsTo([]byte(address))
	var endorsementScore uint64
	for _, e := range endorsements {
		if e.Active {
			amount := e.Amount
			logVal := uint64(0)
			for amount > 0 { amount /= 10; logVal++ }
			if logVal > 0 { endorsementScore += 10 * logVal }
		}
	}
	
	attestations := p.state.GetAttestationsFor([]byte(address))
	var confirmedAttestations, pendingAttestations uint64
	for _, a := range attestations {
		if a.Confirmed { confirmedAttestations++ } else { pendingAttestations++ }
	}
	attestationScore := confirmedAttestations*75 + pendingAttestations*10
	
	ageBonus := age * 2
	if ageBonus > 200 { ageBonus = 200 }
	
	given := p.state.GetEndorsementsFrom([]byte(address))
	activityBonus := uint64(len(given)) * 5
	if activityBonus > 100 { activityBonus = 100 }
	
	governanceBonus := identity.VoteCount*3 + identity.ProposalCount*10
	badgeBonus := identity.BadgeCount * 50
	
	var penalty uint64
	if identity.SlashedAmount > 0 {
		penalty = identity.SlashedAmount / 10
	}

	jsonResponse(w, map[string]interface{}{
		"address": string(identity.Address),
		"reputation": identity.Reputation,
		"breakdown": map[string]uint64{
			"base": 100, "endorsements": endorsementScore,
			"attestations": attestationScore, "age": ageBonus,
			"activity": activityBonus, "governance": governanceBonus,
			"badges": badgeBonus, "penalty": penalty,
		},
		"factors": map[string]interface{}{
			"endorsement_received": len(endorsements),
			"endorsement_given": len(given),
			"attestations_confirmed": confirmedAttestations,
			"attestations_pending": pendingAttestations,
			"account_age_days": age, "proposals_created": identity.ProposalCount,
			"votes_cast": identity.VoteCount, "badges_claimed": identity.BadgeCount,
			"slashed_amount": identity.SlashedAmount,
		},
		"timestamp": time.Now().Unix(),
	})
}

func (p *ReputasiPlugin) rpcSearchIdentities(w http.ResponseWriter, r *http.Request) {
	query := strings.ToLower(r.URL.Query().Get("q"))
	if query == "" {
		errorResponse(w, http.StatusBadRequest, "q parameter required")
		return
	}
	all := p.state.GetAllIdentities()
	var results []Identity
	for _, id := range all {
		if strings.Contains(strings.ToLower(id.DisplayName), query) ||
			strings.Contains(strings.ToLower(id.Bio), query) {
			results = append(results, id)
		}
	}
	jsonResponse(w, map[string]interface{}{
		"query": query, "count": len(results), "results": results,
	})
}

func (p *ReputasiPlugin) rpcGetBadges(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address != "" {
		userBadges := p.state.GetUserBadges([]byte(address))
		var badges []Badge
		for _, ub := range userBadges {
			if b := p.state.GetBadge(ub.BadgeID); b != nil {
				badges = append(badges, *b)
			}
		}
		jsonResponse(w, map[string]interface{}{
			"address": address, "count": len(badges), "badges": badges,
		})
		return
	}
	allBadges := p.state.GetAllBadges()
	jsonResponse(w, map[string]interface{}{
		"count": len(allBadges), "badges": allBadges,
	})
}

func (p *ReputasiPlugin) rpcGetProposals(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	var proposals []Proposal
	if status == "active" {
		proposals = p.state.GetActiveProposals()
	} else {
		proposals = p.state.GetAllProposals()
	}
	jsonResponse(w, map[string]interface{}{
		"status": status, "count": len(proposals), "proposals": proposals,
	})
}

func (p *ReputasiPlugin) rpcGetProposal(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		errorResponse(w, http.StatusBadRequest, "id parameter required")
		return
	}
	proposal := p.state.GetProposal([]byte(id))
	if proposal == nil {
		errorResponse(w, http.StatusNotFound, "proposal not found")
		return
	}
	jsonResponse(w, proposal)
}

func (p *ReputasiPlugin) rpcGetDelegation(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		errorResponse(w, http.StatusBadRequest, "address parameter required")
		return
	}
	identity := p.state.GetIdentity([]byte(address))
	if identity.Address == nil {
		errorResponse(w, http.StatusNotFound, "identity not found")
		return
	}
	
	var delegatedTo *Identity
	if identity.DelegatedTo != nil {
		d := p.state.GetIdentity(identity.DelegatedTo)
		delegatedTo = &d
	}
	
	var delegatedFrom []Identity
	for _, addr := range identity.DelegatedFrom {
		id := p.state.GetIdentity(addr)
		if id.Address != nil {
			delegatedFrom = append(delegatedFrom, id)
		}
	}
	
	jsonResponse(w, map[string]interface{}{
		"address": address,
		"delegated_to": delegatedTo,
		"delegated_from": delegatedFrom,
		"delegated_from_count": len(delegatedFrom),
	})
}

func (p *ReputasiPlugin) rpcGetReports(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	var reports []Report
	if status == "pending" {
		reports = p.state.GetPendingReports()
	} else {
		for _, r := range p.state.reports {
			reports = append(reports, r)
		}
	}
	jsonResponse(w, map[string]interface{}{
		"status": status, "count": len(reports), "reports": reports,
	})
}

func (p *ReputasiPlugin) rpcGetVotingPower(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		errorResponse(w, http.StatusBadRequest, "address parameter required")
		return
	}
	power := p.state.GetVotingPower([]byte(address))
	identity := p.state.GetIdentity([]byte(address))
	jsonResponse(w, map[string]interface{}{
		"address": address,
		"voting_power": power,
		"reputation": identity.Reputation,
		"formula": "sqrt(reputation) + delegated_power",
	})
}

func (p *ReputasiPlugin) rpcGetGovernanceStats(w http.ResponseWriter, r *http.Request) {
	allProposals := p.state.GetAllProposals()
	activeProposals := p.state.GetActiveProposals()
	
	var totalVotes, totalYes, totalNo uint64
	for _, p := range allProposals {
		totalVotes += p.TotalPower
		totalYes += p.YesVotes
		totalNo += p.NoVotes
	}
	
	jsonResponse(w, map[string]interface{}{
		"total_proposals": len(allProposals),
		"active_proposals": len(activeProposals),
		"total_votes_cast": totalVotes,
		"total_yes_votes": totalYes,
		"total_no_votes": totalNo,
		"participation_rate": "calculated_per_proposal",
		"quadratic_voting": true,
		"timestamp": time.Now().Unix(),
	})
}