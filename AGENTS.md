# Reputation v2 — AI Assistant Context

## Project Overview
Reputation v2 is a Canopy blockchain plugin that implements a **universal social reputation infrastructure layer**. It provides staked endorsements, verifiable attestations, quadratic governance, soulbound badges, slashing DAO, and reputation delegation.

## Technology Stack
- **Backend:** Go 1.21+ (Canopy Plugin)
- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **Blockchain:** Canopy Network (local node)
- **RPC:** JSON-RPC over HTTP (ports 50002/50003)

## Custom Transaction Types (13)
| Type | ID | Handler | Requirements |
|------|-----|---------|-------------|
| RegisterIdentity | 0x01 | handleRegisterIdentity | — |
| GiveEndorsement | 0x02 | handleGiveEndorsement | Min 10 tokens |
| RevokeEndorsement | 0x03 | handleRevokeEndorsement | 7-day cooldown, 10% penalty |
| CreateAttestation | 0x04 | handleCreateAttestation | Subject must exist |
| VerifyAttestation | 0x05 | handleVerifyAttestation | 300+ rep, not already verified |
| CreateProposal | 0x06 | handleCreateProposal | 500+ rep, 1-30 day duration |
| VoteProposal | 0x07 | handleVoteProposal | Quadratic voting power |
| ClaimBadge | 0x08 | handleClaimBadge | Meet badge requirements |
| ReportUser | 0x09 | handleReportUser | 500+ rep, not self |
| ProcessReport | 0x0A | handleProcessReport | 1000+ rep jury |
| UpdateReputation | 0x0B | handleUpdateReputation | — |
| DelegateReputation | 0x0C | handleDelegateReputation | Delegatee 1000+ rep |
| UndelegateReputation | 0x0D | handleUndelegateReputation | Currently delegated |

## State Structures
- **Identity**: Address, DisplayName, Bio, AvatarURL, CreatedAt, Reputation, EndorsementCount, AttestationCount, BadgeCount, ProposalCount, VoteCount, ReportCount, SlashedAmount, DelegatedTo, DelegatedFrom
- **Endorsement**: From, To, Amount, Message, CreatedAt, RevokedAt, Active
- **Attestation**: ID, Subject, Claim, Evidence, CreatedBy, CreatedAt, Verifiers, VerifierCount, Confirmed
- **Proposal**: ID, Title, Description, CreatedBy, CreatedAt, EndsAt, Status, YesVotes, NoVotes, TotalPower, Voters, Quorum
- **Badge**: ID, Name, Description, ImageURL, MinReputation, MinEndorsements, MinAttestations, MinAgeDays, Color
- **UserBadge**: BadgeID, User, ClaimedAt
- **Report**: ID, Target, Reporter, Reason, Evidence, CreatedAt, Status, Votes, Voters

## RPC Endpoints (13)
- GET /reputasi/identity?address={addr}
- GET /reputasi/endorsements?address={addr}&direction={given|received}
- GET /reputasi/attestations?address={addr}&status={pending|confirmed}
- GET /reputasi/leaderboard?limit={n}
- GET /reputasi/reputation?address={addr}
- GET /reputasi/search?q={query}
- GET /reputasi/badges?address={addr}
- GET /reputasi/proposals?status={active}
- GET /reputasi/proposal?id={id}
- GET /reputasi/delegation?address={addr}
- GET /reputasi/reports?status={pending}
- GET /reputasi/voting-power?address={addr}
- GET /reputasi/governance-stats

## Key Business Rules
- Minimum endorsement: 10 tokens
- Self-endorsement: prohibited
- Revoke cooldown: 7 days, 10% penalty
- Attestation confirmation: 3 verifiers (300+ rep each)
- Proposal creation: 500+ rep, 1-30 days
- Quadratic voting: sqrt(reputation)
- Badge requirements: vary per badge tier
- Report: 500+ rep to report, 1000+ rep to process
- Slashing: 50% reputation reduction if confirmed
- Delegation: delegatee needs 1000+ rep

## Build Commands
```bash
# Build plugin
cd plugin && go build -o reputasi-v2-plugin

# Run plugin
./reputasi-v2-plugin --connect=localhost:50003

# Start frontend
cd frontend && npm install && npm run dev
```

## Important Notes
- Plugin connects via admin port (50003)
- RPC queries through port 50002
- Initial balance: 100,000 tokens per identity
- Default badges auto-initialized on first registration
- All addresses are byte slices