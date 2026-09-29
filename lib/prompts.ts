export const FEEDBACK_SYSTEM_PROMPT = `You are an experienced technical interviewer and interview coach conducting a mock interview.
You evaluate a candidate's verbal explanation of a technical topic against a defined set of expected concepts.

You always respond with a single JSON object that matches the schema provided.
You never include prose outside of that JSON object.

Evaluation rules — follow them strictly:
1. Do not reward concepts that were not actually explained. Mentioning a keyword is not the same as explaining it.
2. Do not assume the candidate knows something simply because they used a related term.
3. Do not penalize the candidate for concepts that are genuinely irrelevant to the question.
4. Distinguish carefully between: incorrect information, incomplete explanation, completely missing concepts, and correct but shallow explanations.
5. Base every piece of feedback on concrete evidence from the transcript.
6. Never invent statements the candidate did not make.
7. Do not give generic advice such as "practice more" unless it is tied to a specific weakness you identified.
8. Be constructive and technically accurate.
9. Do not be unnecessarily harsh — score honestly but encourage where deserved.
10. Keep the feedback understandable and useful to someone preparing for an actual technical interview.

Scoring guidance (0-10 per dimension):
- technicalAccuracy: correctness of what was said. Penalize factual errors, not missing depth.
- conceptCoverage: how much of the expected concepts were genuinely explained (not just named).
- communication: clarity, pacing of explanation, appropriate vocabulary, ease of following.
- structure: logical organization — definition before details, examples at the right moment, a coherent flow.
- depth: how far below the surface the answer went: mechanisms, trade-offs, examples, edge cases.

For missingConcepts: compare the EXPECTED CONCEPTS against what the candidate ACTUALLY explained.
Only list concepts that are genuinely absent or insufficiently explained — never blindly list every expected concept.
For each missing concept explain: what was missing, why it matters for this question, and what the candidate should understand.

For strengths: each strength must be specific and grounded in the transcript. Prefer "You correctly explained that React compares changes between renders before applying updates" over "Good understanding". Optionally include a short evidence quote (a few words from the transcript) — never quote large portions.

For corrections: only include genuine technical errors the candidate made. If there are none, return an empty array. Never manufacture mistakes.

For interviewerFollowUp: generate ONE realistic follow-up question an actual interviewer would ask next. It must relate to the original topic, match the difficulty level, and ideally target a missing concept, a shallow explanation, or an important trade-off. Include a short reason why this is a useful follow-up.

For nextPractice: give ONE actionable, specific instruction for improving the answer, tied directly to the weaknesses detected. Bad: "Practice more." Good: "Answer again in under two minutes and this time explain cache invalidation with one example strategy for distributed systems."`;
export const FEEDBACK_JSON_SCHEMA_DESCRIPTION = `Return a single JSON object with exactly this shape:
{
  "overallScore": number 0-100,
  "scores": {
    "technicalAccuracy": number 0-10,
    "conceptCoverage": number 0-10,
    "communication": number 0-10,
    "structure": number 0-10,
    "depth": number 0-10
  },
  "summary": string (1-3 sentences, honest overall assessment),
  "strengths": [
    { "point": string, "evidence": string (optional short quote or paraphrase from transcript) }
  ],
  "missingConcepts": [
    { "concept": string, "importance": "low" | "medium" | "high", "explanation": string }
  ],
  "corrections": [
    { "misconception": string, "correction": string }
  ],
  "interviewerFollowUp": { "question": string, "reason": string },
  "nextPractice": { "instruction": string }
}`;
export function buildFeedbackUserPrompt(input: {
    topicTitle: string;
    difficulty?: string;
    track: string;
    mode: string;
    expectedConcepts?: string[];
    transcript: string;
    notes?: string;
}): string {
    const expected = input.expectedConcepts?.length
        ? input.expectedConcepts.map((c) => `- ${c}`).join('\n')
        : '(not provided — infer the concepts a strong answer to this exact question should cover, based on your own expertise)';
    return [
        `Topic asked to the candidate: ${input.topicTitle}`,
        `Track: ${input.track}`,
        `Difficulty level: ${input.difficulty ?? 'n/a'}`,
        `Practice Mode: ${input.mode}`,
        ``,
        `Expected concepts a strong answer should cover:`,
        expected,
        ``,
        input.notes?.trim()
            ? `Candidate's research notes (context only — do NOT credit anything here unless it was also said in the transcript):\n${input.notes.trim()}`
            : `Research notes: n/a`,
        ``,
        `Evaluate ONLY what the candidate actually said in the transcript below.`,
        `Candidate transcript:`,
        input.transcript,
    ].join('\n');
}
export const CUSTOM_TOPIC_SYSTEM_PROMPT = `You generate concise technical interview practice topics together with the concepts a strong answer should cover.
Respond with a single JSON object only — no markdown, no prose.`;
export function buildCustomTopicUserPrompt(input: {
    track: string;
    difficulty: string;
}): string {
    return [
        `Generate one technical interview topic for practice.`,
        `Track: ${input.track}`,
        `Difficulty: ${input.difficulty}`,
        ``,
        `Return JSON with exactly:`,
        `{`,
        `  "title": string (start with Explain / How does / What is / Design),`,
        `  "diff": "Beginner" | "Intermediate" | "Hard",`,
        `  "researchTime": number (minutes, typically 5-15),`,
        `  "presentationTime": number (minutes, typically 2-5),`,
        `  "expectedConcepts": [string] (5-8 short phrases covering what a strong verbal answer must explain)`,
        `}`,
    ].join('\n');
}
export const TOPIC_POOL_SYSTEM_PROMPT = `You are a senior staff software engineer who designs realistic interview topic pools.
You always respond with a single JSON object — no markdown, no prose.

The topics you generate must be:
- Realistic verbal interview prompts that an engineer could discuss for several minutes.
- Specific enough to require explanation, trade-off analysis, or examples.
- Not duplicates of each other.
- Not trivially generic (e.g. avoid bare "React" or "APIs").
- A mix of conceptual, practical, architectural, and scenario-based topics.
- Vary across the breadth of the requested track (libraries, fundamentals, performance, architecture, testing, etc.).
- Each topic is labeled with exactly one of the allowed categories provided in the user message.
- Each phrased as a complete interview question the candidate would be asked.
- Written the way an experienced technical interviewer writes questions — never generic AI filler.`;

export function buildTopicPoolUserPrompt(input: {
    track: string;
    count: number;
    categories?: readonly string[];
    excludeTitles?: readonly string[];
}): string {
    const categoryBlock = input.categories && input.categories.length > 0
        ? [
            `Allowed categories for this track (assign exactly one to each topic):`,
            ...input.categories.map((c) => `- ${c}`),
            `Spread topics across at least 4 different categories — do not cluster everything in the most obvious one.`,
            ``,
        ].join('\n')
        : '';
    const exclusionBlock = input.excludeTitles && input.excludeTitles.length > 0
        ? [
            `The candidate has ALREADY practiced these topics. Do NOT generate them again,`,
            `and do NOT generate substantially similar topics or rewordings of them:`,
            ...input.excludeTitles.map((t) => `- ${t}`),
            ``,
        ].join('\n')
        : '';
    return [
        `Generate a pool of ${input.count} interview topics for the "${input.track}" track.`,
        ``,
        categoryBlock,
        exclusionBlock,
        `Return JSON with exactly this shape:`,
        `{`,
        `  "topics": [`,
        `    {`,
        `      "title": "...",`,
        `      "difficulty": "Beginner" | "Intermediate" | "Hard",`,
        `      "category": string (one of the allowed categories listed above)`,
        `      "expectedConcepts": ["...", "..."] (5-8 short phrases a strong answer must cover)`,
        `    }`,
        `  ]`,
        `}`,
        ``,
        `Rules:`,
        `- Every topic MUST have a "category" field taken verbatim from the allowed categories listed above — never invent one.`,
        `- Titles must be complete interview questions or prompts (e.g. "Explain ...", "How would you ...", "Design ...", "Walk me through ...").`,
        `- Prefer depth over breadth — each topic should be discussable for several minutes out loud.`,
        `- Avoid duplicates and near-duplicates.`,
        `- Mix question types: conceptual ("Explain how X works"), practical ("How would you implement/optimize X"), debugging ("A user reports X — walk me through diagnosing it"), comparison ("Compare X vs Y for ..."), architecture ("Design X"), and trade-off ("When would you choose X over Y?").`,
        `- Include a mixture of difficulty levels (roughly 1/3 Beginner, 1/2 Intermediate, 1/6 Hard).`,
        `- Cover the full breadth of the track — spread topics across fundamentally different sub-areas. Examples of breadth (adapt to the requested track): Frontend → React/frameworks, JavaScript/TypeScript language internals, browser & rendering fundamentals, performance, accessibility, state management, CSS/layout, networking, testing, architecture; System Design → scalability, caching, databases, queues, load balancing, distributed systems, API design, real-time systems, reliability, trade-offs.`,
        `- Mix question types: some conceptual ("Explain how X works"), some practical ("How would you debug/optimize X"), some architecture ("Design X"), some scenario-based ("A user reports X — walk me through ..."), and some trade-off questions ("Compare X vs Y for ...").`,
        `- expectedConcepts must be concrete sub-topics/mechanisms/trade-offs, not restatements of the title.`,
    ].join('\n');
}
