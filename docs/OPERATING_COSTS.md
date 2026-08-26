# Operating Costs

Developer-facing overview of every operation in Whiteboard that can incur an
AI provider cost, how to estimate it, and where costs could grow. No secrets
or API keys live in this repository — all provider configuration is in
environment variables on the deployment platform.

---

## 1. Architecture at a glance

```
Browser (React SPA, static files on Vercel CDN)
   │  fetch (no API key in the browser)
   ▼
Vercel serverless functions: /api/topics · /api/custom-topic · /api/feedback
   │  OPENROUTER_API_KEY (server-side only)
   ▼
OpenRouter chat completions (model: OPENROUTER_MODEL env var,
default mistralai/voxtral-small-24b-2507)
```

Infrastructure is intentionally minimal: static hosting + serverless
functions + OpenRouter. No database, Redis, queues, workers, or cron.

---

## 2. AI operations that incur provider cost

| # | Operation | Trigger | Endpoint | Server function |
|---|-----------|---------|----------|-----------------|
| 1 | **Topic pool generation** | First visit per track, or background refill when < 3 AI topics remain | `POST /api/topics` | `generateTopicPool()` |
| 2 | **Custom topic** | User clicks "Generate custom topic" (one at a time, client-guarded) | `POST /api/custom-topic` | `generateCustomTopic()` |
| 3 | **AI feedback** | User explicitly requests feedback after recording | `POST /api/feedback` | `generateFeedback()` |

### What each operation sends and receives (approximate token sizes)

Exact token counts depend on prompt content; these are planning estimates:

| Operation | Input tokens (est.) | Output tokens (est.) | Notes |
|-----------|--------------------:|---------------------:|-------|
| Topic pool | ~700–900 | ~800–1,200 | Returns up to 16 topics with title/difficulty/expectedConcepts |
| Custom topic | ~400–600 | ~100–200 | Single topic |
| Feedback | ~1,200–2,500+ | ~600–900 | Input scales with transcript + research-notes length |

### Retry behavior (hidden second call)

`lib/ai.ts` retries a request **once**, only when the model rejects JSON mode
(HTTP 400 with `response_format`). For models that support JSON mode this
retry never fires. Worst case: any single user action costs 2 calls instead
of 1. There are no other automatic retries anywhere in the codebase.

---

## 3. Cost calculation method

Provider prices vary over time — do not hardcode them. Estimate like this:

```
monthly_cost ≈ sessions_per_month
             × [ pool_calls_per_session × pool_in_tokens × price_in
                 + pool_out_tokens × price_out ]
             + feedback_requests_per_month × (feedback_in × price_in
                 + feedback_out × price_out)
             + custom_topic_clicks_per_month × (custom_in × price_in
                 + custom_out × price_out)
```

Typical session shape (one user, one sitting):

- 1 topic-pool generation (cached afterwards for the whole tab session)
- 0–1 refills (only after ~8+ spins exhaust the AI pool)
- 0–1 custom topics (optional, user-initiated)
- 1–3 feedback evaluations (practice → feedback → Practice Again loop)

Worked example (formula only — plug in current OpenRouter prices):

> At ~2 pool generations + 2 feedback evaluations per session, and 5,000
> sessions/month: `(5,000 × 2 × ~1,000) + (10,000 × ~2,000)` ≈ **~30M input
> tokens + ~4M output tokens per month**. Multiply by your model's current
> per-token price to get the estimate.

Check OpenRouter's activity dashboard for actual usage before quoting numbers.

---

## 4. Which operations are cached (free)

- **Topic pools**: cached in memory + `sessionStorage`, keyed by track.
  Survives page reloads within the tab session. Spinning never calls the AI.
- **Background refills**: fire only when fewer than 3 AI topics remain, and
  are deduplicated — at most one generation and one refill per track can run
  concurrently (`inflightByTrack` / `refillsInFlight` guards).
- **Static fallback topics** (`src/data/*.json`): zero cost, always available.
- **Practice Again**: re-practices the same topic with no new AI request until
  feedback is requested again.
- Page reloads reuse the persisted sessionStorage pool — no regeneration.

## 5. Where costs could increase

1. **Many tracks explored in one visit** — each track generates its own pool
   once (6 tracks ≈ 6 pool calls worst case).
2. **Heavy spinning** — refills trigger roughly once per ~7–10 spins after
   the initial pool is consumed.
3. **Long transcripts** — feedback input tokens scale linearly with speech
   length (a 10-minute answer costs more than a 2-minute pitch).
4. **Custom-topic clicks** — unbounded per session by design; client guard
   only prevents parallel duplicates, not repeated clicks.
5. **JSON-mode retry** — doubles one call's cost when it fires (rare).
6. **Abuse/bots** — there is no rate limiting today; a bad actor could drive
   volume through the three endpoints. If this becomes real, add a light
   per-IP throttle at the Vercel level or in front of OpenRouter.

## 6. Infrastructure required vs optional

**Required**

| Service | Purpose | Cost profile |
|---------|---------|--------------|
| Static hosting + serverless functions (Vercel) | SPA + 3 API routes | Free tier covers small traffic; functions have generous free allowance |
| OpenRouter account + API key | All AI operations | Pay-per-token |

**Optional**

| Service | Purpose | Cost profile |
|---------|---------|--------------|
| PostHog | Anonymous product analytics | Free tier (1M events/mo); disabled entirely if `VITE_POSTHOG_KEY` unset |
| Custom domain | Branding | Registrar pricing |

**Deliberately not used:** database, auth provider, Redis/cache server,
message queues, background workers, cron jobs. The app is fully stateless on
the server; all persistence is client-side (`sessionStorage`, `localStorage`).

---

## 7. Environment variables

| Variable | Where used | Required |
|----------|-----------|----------|
| `OPENROUTER_API_KEY` | Server-side only (`lib/ai.ts`) | Yes (for AI features) |
| `OPENROUTER_MODEL` | Server-side only | No — defaults to `mistralai/voxtral-small-24b-2507` |
| `VITE_POSTHOG_KEY` | Client (analytics) | No — analytics no-ops without it |
| `VITE_POSTHOG_HOST` | Client (analytics) | No — defaults to PostHog US ingest |
