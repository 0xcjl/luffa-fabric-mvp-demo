# LAEL / Luffa Fabric Requirements v0.3

## Positioning

**LAEL / Luffa Fabric: Verifiable Adaptive Resource Runtime for Agentic Economy**

LAEL is Luffa's Agentic Runtime Fabric and a trusted execution infrastructure that external AI agents, communities, applications, and services can integrate with.

LAEL is not a generic AI agent product, chatbot, workflow builder, MCP wrapper, or agent marketplace. Its core problem is not whether an agent can call a tool, but:

- Who is executing?
- Is the execution authorized?
- Is the execution process controllable?
- Is the result verifiable?
- Can value, resources, costs, and rewards be measured and settled?
- Can responsibility be traced?
- Can community context be learned and accumulated?
- Can the system improve without breaking safety boundaries?

The long-term goal is to upgrade AI agents from tool callers into trusted digital subjects with identity, capability boundaries, execution accountability, economic settlement, reputation, and contextual learning.

## Core Loop

LAEL's unified execution loop is:

```text
Identity -> Permission -> Execution -> Settlement -> Evidence -> Feedback -> Learning
```

| Layer | Meaning |
| --- | --- |
| Identity | Unify human, agent, service account, wallet, and external runtime identities. |
| Permission | Use Smart Permission to decide whether an action is allowed, needs confirmation, or exceeds boundaries. |
| Execution | Route every critical agent action through a controlled runtime or adapter. |
| Settlement | Record value, cost, reward, on-chain transaction, fiat proof, API usage, or compute usage. |
| Evidence | Generate execution receipts, trace digests, settlement proofs, and optional on-chain attestations. |
| Feedback | Bind user or system feedback to a receipt. |
| Learning | Produce learning signals from success, failure, denial, feedback, and settlement outcomes. |

## Five Principles

| Principle | Meaning |
| --- | --- |
| Composable | Agents, skills, workflows, policies, contexts, and settlement rails can be composed. |
| Verifiable | Critical executions produce verifiable evidence, not casual logs. |
| Adaptive | The system learns from execution outcomes, feedback, and community context. |
| Governable | Learning and automation cannot bypass permission, safety, privacy, payment, or approval boundaries. |
| Open Infrastructure | The system grows deeply inside Luffa while exposing standard interfaces to external ecosystems. |

## Governance Extension / Microsoft AGT Adapter

LAEL's Permission layer should remain pluggable. Microsoft AGT can be integrated as one external governance brick inside the Permission / Governance Extension Layer to strengthen policy enforcement, tool-call interception, audit decision records, MCP security gateway, runtime guard, and SRE / kill switch.

AGT does not replace the Luffa Fabric core protocol, Luffa DID / Mapping DID, wallet signing, settlement, Execution Receipt, Learning, or reputation. In the first phase it is only an optional adapter; Luffa Native Policy remains the default permission module.

| AGT Capability | Luffa Layer | Phase-one Handling |
| --- | --- | --- |
| Policy Engine | Permission Extension | Optional adapter. |
| Tool Call Interception | Execution Extension | Prioritize off-chain Agent / MCP tool guard. |
| Audit Decision Record | Evidence Extension | Map into Luffa receipt metadata. |
| Sandbox / Runtime Guard | Execution Extension | Future optional integration. |
| SRE / Kill Switch | Governance Extension | Future optional integration. |

## Unified Architecture

LAEL follows a unified architecture: off-chain execution, on-chain verifiability, and on-chain value execution.

```text
External User / Community / App
-> Agent DID Mapping
-> Intent / Action
-> Smart Permission
-> Runtime Execution
-> Settlement / Resource Accounting
-> Execution Receipt
-> Trace / Evidence Digest
-> Feedback
-> Learning Signal
-> Safer Next Execution
```

## Two Capability Paths

### Off-chain Agent Execution

This path serves off-chain agent runtimes such as OpenClaw, Hermes, Claude Code, Codex, and API agents. Execution may happen off-chain, but identity, permission, behavior trajectory, receipts, settlement proofs, and learning signals must map back to LAEL.

Core capabilities:

- Map an external agent to a LAEL Agent DID.
- Allow the agent to read only authorized context.
- Prevent adapters from executing outside the runtime.
- Generate receipts for success, failure, denial, and pending approval.
- Produce trace digests that can later be anchored on-chain.

### On-chain Value Execution

This path covers on-chain value actions, not only payment. It includes transfer, trading/swap, settlement, reward, claim, and payment.

Phase 1 real execution:

- Base Sepolia ETH transfer.
- Base Sepolia USDC transfer.
- Settlement record and txHash recording.

Phase 1 simulated execution:

- Trading / swap proposal.
- Fiat proof, invoice proof, resource credit, and on/off-ramp intent.

## DID Mapping

Off-chain agents and non-DID users also need LAEL mapping DIDs. In the MVP, the mapping DID does not need to be written on-chain immediately, but it must form a stable mapping:

```text
external_agent_id -> did:luffa:agent:* -> execution receipt -> optional on-chain attestation
```

## Evidence Strategy

| Layer | Content | MVP Handling |
| --- | --- | --- |
| Private Log | raw input, context, adapter output, feedback | Stored locally and not published on-chain. |
| Verifiable Digest | receipt hash, trace hash, settlement proof hash | Must be generated or displayable in the MVP. |
| On-chain Attestation | DID mapping or receipt digest anchoring | Simulated in Phase 1; real anchoring later. |

## Settlement Definition

Settlement is not the same as crypto payment. It is the proof or record of value, cost, reward, payment, resource usage, or settlement created by agent execution.

| Rail | Meaning | MVP Status |
| --- | --- | --- |
| evm-native | ETH/native token transfer | Implemented. |
| evm-erc20 | USDC/USDT/token transfer | Implemented. |
| luffa-points | Internal points or credit | Implemented. |
| fiat-proof | Fiat payment proof | Simulated in Phase 1. |
| invoice-proof | Invoice or billing record | Simulated in Phase 1. |
| resource-credit | API cost, compute unit, agent usage | Simulated in Phase 1. |
| onofframp-intent | Fiat and crypto on/off-ramp intent | Simulated in Phase 1. |

## Safety Boundaries

- Do not store seed phrases, private keys, or mnemonics.
- Do not let agents bypass human confirmation.
- Learning does not automatically increase limits.
- Learning does not automatically add recipients or protocols.
- Learning does not export training data unless the user explicitly authorizes it.
- Trading/swap does not connect to real DEXs in Phase 1.
- Fiat does not connect to Stripe, banks, or real on/off-ramp providers in Phase 1.
