🌿 Reputation v2 — Universal Social Layer

> **One-Line Pitch:** The first onchain reputation infrastructure that makes trust portable across all communities — with quadratic governance, soulbound badges, and community-driven quality control.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Go](https://img.shields.io/badge/Go-1.24+-00ADD8.svg)
![React](https://img.shields.io/badge/React-18+-61DAFB.svg)
![Canopy](https://img.shields.io/badge/Canopy-Network-green.svg)

## 🎯 What Makes Reputasi v2 Special?

Unlike other Social-Fi apps that are just "decentralized Twitter clones", **Reputasi v2** is an **infrastructure layer** that any dApp can use:

| Feature | Why It Matters |
|---------|---------------|
| 🔗 **Staked Endorsements** | Real economic backing = real trust, not fake followers |
| 🛡️ **3-Verifier Attestations** | Community-validated claims, not self-declared |
| ⚖️ **Quadratic Governance** | Prevents whale dominance, empowers community |
| 🎖️ **Soulbound Badges** | Achievement NFTs that can't be traded or faked |
| 🔥 **Slashing DAO** | Community-driven quality control |
| 🤝 **Reputation Delegation** | Liquid democracy for social trust |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              dApps (Any App Can Query)                  │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐   │
│  │  DeFi   │ │  DAOs   │ │  Social  │ │  Gaming  │   │
│  └────┬────┘ └────┬────┘ └────┬─────┘ └────┬─────┘   │
└───────┼───────────┼──────────┼────────────┼──────────┘
        │           │          │            │
        └───────────┴────┬─────┴────────────┘
                         │ Reputasi SDK
┌────────────────────────┼──────────────────────────────┐
│              Reputasi Plugin (Go)                      │
│  ┌─────────┐ ┌────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Identity│ │Endorse │ │Governance│ │  Badges    │  │
│  │ Registry│ │ Engine │ │  DAO     │ │  (SBT)     │  │
│  └─────────┘ └────────┘ └──────────┘ └────────────┘  │
│  ┌─────────┐ ┌────────┐ ┌──────────┐                  │
│  │Attest   │ │Report  │ │Delegate  │                  │
│  │Verifier │ │Slasher │ │System    │                  │
│  └─────────┘ └────────┘ └──────────┘                  │
└────────────────────────┬──────────────────────────────┘
                         │ Plugin Interface
┌────────────────────────┼──────────────────────────────┐
│              Canopy Blockchain Node                     │
│              (Ports: 50002 / 50003)                     │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- [Go 1.21+](https://go.dev/dl/)
- [Node.js 18+](https://nodejs.org/)
- [Canopy Node](https://github.com/canopy-network/canopy) running locally

### 1. Start Canopy Local Node

```bash
git clone https://github.com/canopy-network/canopy
cd canopy
make build/canopy-full
./canopy start --rpc-port=50002 --admin-port=50003
```

### 2. Build & Run Plugin

```bash
cd plugin
go build -o reputasi-v2-plugin
./reputasi-v2-plugin --connect=localhost:50003
```

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

## 📋 Custom Transaction Types (13 Types!)

| Type | ID | Description | Min Rep |
|------|-----|-------------|---------|
| `RegisterIdentity` | `0x01` | Create onchain identity | — |
| `GiveEndorsement` | `0x02` | Stake tokens to endorse | — |
| `RevokeEndorsement` | `0x03` | Withdraw (7d + 10% penalty) | — |
| `CreateAttestation` | `0x04` | Create verifiable claim | — |
| `VerifyAttestation` | `0x05` | Verify claim (needs 300+ rep) | 300 |
| `CreateProposal` | `0x06` | Create governance proposal | 500 |
| `VoteProposal` | `0x07` | Vote with quadratic power | — |
| `ClaimBadge` | `0x08` | Claim soulbound achievement | varies |
| `ReportUser` | `0x09` | Report bad behavior | 500 |
| `ProcessReport` | `0x0A` | Vote on report (jury) | 1000 |
| `UpdateReputation` | `0x0B` | Trigger recalculation | — |
| `DelegateReputation` | `0x0C` | Delegate voting power | — |
| `UndelegateReputation` | `0x0D` | Remove delegation | — |

## 🔌 RPC Endpoints (15 Endpoints!)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/reputasi/identity` | GET | Get identity by address |
| `/reputasi/endorsements` | GET | Get endorsements (given/received) |
| `/reputasi/attestations` | GET | Get attestations (pending/confirmed) |
| `/reputasi/leaderboard` | GET | Get reputation leaderboard |
| `/reputasi/reputation` | GET | Detailed reputation breakdown |
| `/reputasi/search` | GET | Search identities by name/bio |
| `/reputasi/badges` | GET | Get all badges or user's badges |
| `/reputasi/proposals` | GET | Get proposals (all/active) |
| `/reputasi/proposal` | GET | Get single proposal by ID |
| `/reputasi/delegation` | GET | Get delegation info |
| `/reputasi/reports` | GET | Get reports (pending/all) |
| `/reputasi/voting-power` | GET | Get quadratic voting power |
| `/reputasi/governance-stats` | GET | Governance statistics |

## 🧮 Reputation Algorithm (Multi-Factor)

```
Reputation = Base(100)
         + EndorsementScore(10 * log10(amount) per endorsement)
         + AttestationScore(75 per confirmed, 10 per pending)
         + AgeBonus(2 per day, max 200)
         + ActivityBonus(5 per endorsement given, max 100)
         + GovernanceBonus(3 per vote, 10 per proposal)
         + BadgeBonus(50 per badge)
         - SlashingPenalty(slashed_amount / 10)
         
Max: 10,000
```

## ⚖️ Quadratic Governance

```go
// Prevents whale dominance
VotingPower = sqrt(Reputation) + sum(sqrt(DelegatedReputation))

// Example:
// Whale with 10,000 rep → 100 voting power
// 100 users with 100 rep each → 100 * 10 = 1,000 voting power
```

## 🎖️ Soulbound Badge System

| Badge | Name | Requirements |
|-------|------|-------------|
| 🌱 Seedling | Register identity | 100 rep |
| 🌿 Sprout | Growing trust | 500 rep, 2 endorsements, 7 days |
| 🛡️ Guardian | Community protector | 1000 rep, 5 endorsements, 14 days |
| 👑 Elder | Respected elder | 3000 rep, 10 endorsements, 3 attestations, 30 days |
| 🔥 Legend | Onchain legend | 5000 rep, 25 endorsements, 10 attestations, 60 days |

## 🔥 Slashing DAO

```
1. Any user with 500+ rep can report another user
2. 5 high-rep (1000+) users vote on the report
3. If confirmed: target's reputation slashed by 50%
4. If rejected: report dismissed, reporter reputation -10
```

## 🤝 Reputation Delegation

- Delegate your voting power to a trusted community member
- Delegatee must have 1000+ reputation
- You can't vote directly if delegated
- Undelegate anytime

## 🎨 Demo Flow

1. **Register Identity** → Claim 🌱 Seedling badge
2. **Give Endorsements** → Build trust network
3. **Create Attestation** → "Expert Solidity developer"
4. **Community Verifies** → 3 verifiers confirm
5. **Reputation Grows** → Unlock 🌿 Sprout badge
6. **Create Proposal** → "Add new badge tier"
7. **Quadratic Vote** → Community decides
8. **Delegate Power** → Trust representative
9. **Report Bad Actor** → Slashing DAO activates
10. **Check Leaderboard** → See your rank!

## 🛠️ Tech Stack

- **Backend:** Go (Canopy Plugin Template)
- **Frontend:** React + TypeScript + Tailwind CSS
- **Blockchain:** Canopy Network
- **RPC:** JSON-RPC over HTTP (Ports 50002/50003)

## 📁 Project Structure

```
reputasi-v2/
├── plugin/
│   ├── main.go           # Plugin entry + 13 tx types
│   ├── state.go          # 8 state structs + management
│   ├── transactions.go   # All transaction handlers
│   ├── rpc.go            # 13 RPC endpoints
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   └── pages/        # 5 pages
│   └── package.json
├── README.md
├── AGENTS.md
└── LICENSE
```

## 🏆 Why This Wins

| Criteria | Reputasi v2 |
|----------|-------------|
| **Original** | ✅ First reputation infrastructure on Canopy |
| **Social-Fi** | ✅ Pure social layer — trust, reputation, governance |
| **Function** | ✅ 13 tx types, 15 RPC endpoints, real utility |
| **Templates** | ✅ Go Canopy Template |
| **RPC** | ✅ Full read/write via ports 50002/50003 |
| **Open Source** | ✅ MIT License |
| **Infrastructure** | ✅ Other dApps can query reputation |
| **Anti-Sybil** | ✅ Staked endorsements + quadratic voting |
| **Community** | ✅ Slashing DAO + delegation |

## 🤝 Contributing

Built for **Canopy Vibe Code Contest #2** (Social-Fi theme).

## 📜 License

MIT License

## 🔗 Links

- [Canopy Network](https://github.com/canopy-network/canopy)
- [Canopy Builder Docs](https://docs.google.com/document/d/16oDUlLkLvp9zKH4hLNo6iuJJV9To1UlMhqhE_4p69Oo)
- [Contest Discord](https://discord.com/channels/1310733928436600912/1445423487106809918)

---

Built with 💚 for the Canopy community. **Trust is earned, not bought.**