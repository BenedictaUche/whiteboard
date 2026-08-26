# Monetization Strategy (Future)

Product-strategy notes for making Whiteboard commercially viable **without**
changing what it is today: anonymous, simple, fast, no login, no database.

This document describes future direction. Nothing here is implemented yet,
and the current product remains entirely free.

---

## 1. What the product is

> Pick a track → Spin a topic → Practice speaking → Get interview-grade AI
> feedback → Practice again.

Core value: realistic verbal technical-interview practice with specific,
evidence-based coaching — in under a minute, with zero friction.

## 2. Potential target customers

| Segment | Why they'd pay | Willingness |
|---------|---------------|-------------|
| Job-seeking developers (self-serve) | Interview prep without $100+/hr mock interviews | Medium, one-time or short subscription |
| Coding bootcamps & career programs | Speaking practice their curriculum lacks; measurable via aggregate analytics | High (B2B), recurring |
| University CS / career centers | Low-cost add-on to career services | Medium (B2B), seasonal |
| Bootcamp/instructor content creators | White-label topic packs for their students | Niche but easy |

The B2B segments matter most per-customer; self-serve matters most for
validation volume.

## 3. Candidate models

### A. Freemium (subscription)
- **Free tier**: everything today, possibly capped (e.g. 5 feedback
  evaluations/month) — generous enough to keep goodwill.
- **Pro tier** (~$8–15/mo): unlimited feedback, premium modes (e.g.
  "Grill Mode" with harder follow-up chains), richer feedback depth.
- **What must be built**: an entitlement check at the server's single AI
  choke point (`lib/ai.ts` → the three API routes), plus some form of
  identity (the first real architectural addition: lightweight accounts or
  signed device tokens).

### B. One-time interview packs
- Frontend Pack, System Design Pack, React Deep-Dive Pack, etc.: curated
  topic banks + difficulty tuning + pack-specific expected-concept rubrics.
- **What must be built**: pack metadata on topics (already partially exists:
  `track`, `difficulty`, `expectedConcepts` flow through every request),
  an unlock mechanism, and checkout. No schema change to the practice loop.

### C. Premium AI feedback
- Deeper feedback variant (longer analysis, model answer comparison,
  multi-round follow-ups) as a paid toggle.
- **What must be built**: mostly prompt/model changes behind the existing
  `/api/feedback` request shape — `mode` and `difficulty` already travel
  with every request, so a `tier`/`product` field slots in naturally.

### D. B2B (bootcamps, career programs)
- Cohort licenses + an instructor-facing aggregate view ("how many sessions
  did the cohort run, where do they struggle") — built on existing anonymous
  analytics events, never transcripts.
- **What must be built**: org accounts, seat management, an aggregate
  reporting endpoint. Largest build; validate demand first.

## 4. Architectural decisions already made that keep these open

- **Single server-side AI gateway** (`lib/ai.ts`, used only by the three API
  routes): any future entitlement/tier check has exactly one choke point.
- **API key never leaves the server**: gating AI usage server-side is
  trivially enforceable later.
- **Stateless, no database**: adding auth/accounts later is additive, not a
  migration. Nothing to unwind.
- **Structured feedback schema** (`AIFeedback` with dimension scores):
  richer/paid feedback variants are prompt-level changes, not UI rewrites.
- **Topic context travels with every request** (`track`, `difficulty`,
  `expectedConcepts`): packs and tiering can ride existing fields.
- **Anonymous analytics events already instrument the funnel**: conversion
  measurement (visit → spin → practice → feedback) works from day one of any
  pricing experiment.
- **Cost controls documented** (`OPERATING_COSTS.md`): free-tier caps can be
  set from real unit economics.

## 5. What NOT to build yet

- Authentication, user accounts, passwords
- Payments/billing integration
- Databases, queues, background workers
- Any UI that mentions pricing

Every one of these can be added later without rework because of the choke
points above. Building them now would slow validation without revenue.

## 6. Simplest model to validate first

**B. One-time interview packs**, validated in this order:

1. Ship one curated pack (e.g. "System Design Interview Pack") as **free**
   content first and measure engagement via existing analytics events.
2. If engagement is strong, gate a second pack behind a one-time purchase —
   lowest-friction payment (no recurring billing infrastructure, no account
   requirement beyond an emailed license/link).
3. Only then consider freemium/B2B, which need accounts and recurring
   billing respectively.

Rationale: packs reuse the entire existing pipeline (topics +
expectedConcepts + feedback), require the least new infrastructure, and
produce real revenue signal before any recurring-billing commitment.
