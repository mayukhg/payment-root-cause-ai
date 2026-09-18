export type ToolCall = {
  id: string;
  name: string;
  purpose: string;
  sql?: string;
  elapsedMs: number;
  rows: Record<string, string | number>[];
};

export type AnalyzeResult = {
  kind: "diagnosis" | "out_of_slice" | "unclear";
  steps: string[];
  headline: string;
  narrative: string;
  window?: string;
  primaryCause?: string;
  ruledOut?: string[];
  action?: string;
  notProven?: string;
  citations: string[];
  hourly: { hour: string; authRate: number; baseline: number }[];
  tools: ToolCall[];
};

const GOLDEN_QUESTION =
  "Our authorization rate dropped 5% last Tuesday. What happened?";

const hourly: AnalyzeResult["hourly"] = [
  { hour: "00:00", authRate: 91.4, baseline: 91.3 },
  { hour: "03:00", authRate: 91.6, baseline: 91.2 },
  { hour: "06:00", authRate: 91.1, baseline: 91.0 },
  { hour: "09:00", authRate: 91.3, baseline: 91.2 },
  { hour: "12:00", authRate: 91.0, baseline: 91.1 },
  { hour: "14:00", authRate: 90.8, baseline: 91.2 },
  { hour: "15:00", authRate: 86.1, baseline: 91.2 },
  { hour: "16:00", authRate: 86.3, baseline: 91.1 },
  { hour: "17:00", authRate: 88.4, baseline: 91.2 },
  { hour: "18:00", authRate: 90.6, baseline: 91.3 },
  { hour: "21:00", authRate: 91.2, baseline: 91.4 },
];

const diagnosis: AnalyzeResult = {
  kind: "diagnosis",
  steps: [
    "Resolved “last Tuesday” against demo clock 2026-09-18 → 2026-09-15.",
    "Located drop: 15:00–17:00 UTC, −5.1pp vs 14-day hourly baseline.",
    "Sliced failures: GATEWAY_TIMEOUT on stripe_connect_eu dominates missing auths.",
    "Correlated deploy gw-timeout-retry-v2 (Mon 18:40 UTC) on that gateway.",
    "Projected bypass: book auth rate ~90.4% if that gateway is excluded.",
  ],
  headline: "Timeouts on stripe_connect_eu, Tuesday 15:00–17:00 UTC",
  narrative: `The authorization rate dipped on Tuesday 15 Sep between 15:00 and 17:00 UTC (−5.1pp vs the prior two-week hourly baseline).

The primary driver was a spike in GATEWAY_TIMEOUT on stripe_connect_eu (EU card traffic). Timeouts went from ~0.4% of attempts to 6.1% in that window, matching a p95 latency jump on that gateway only (210ms → 2.4s).

This lines up with deploy gw-timeout-retry-v2 (Mon 18:40 UTC) that changed acquire timeout and retry collapse on that processor. Issuer rejections and insufficient-funds rates did not move, so this is not an issuer or customer-funds story.`,
  window: "2026-09-15 15:00–17:00 UTC",
  primaryCause: "GATEWAY_TIMEOUT on stripe_connect_eu",
  ruledOut: [
    "ISSUER_REJECTION (delta < 0.3pp)",
    "DECLINE_INSUFFICIENT_FUNDS (flat)",
    "Competitor_Site_Downtime (Wednesday, not Tuesday)",
    "ACH / wallet mix (card-only movement)",
  ],
  action:
    "Fail closed away from stripe_connect_eu for EU card auths, or roll back gw-timeout-retry-v2. Watch timeout share for 60 minutes.",
  notProven:
    "We did not prove the deploy caused the latency — only that it overlaps the same gateway and precedes the window.",
  citations: ["tc_01", "tc_02", "tc_03", "tc_04"],
  hourly,
  tools: [
    {
      id: "tc_01",
      name: "run_sql",
      purpose: "Hourly auth rate on 2026-09-15 vs 14-day baseline",
      elapsedMs: 18,
      sql: `SELECT hour, auth_rate, baseline_14d
FROM v_hourly_auth_rate
WHERE day = '2026-09-15'
ORDER BY hour;`,
      rows: [
        { hour: "14:00", auth_rate: 90.8, baseline_14d: 91.2 },
        { hour: "15:00", auth_rate: 86.1, baseline_14d: 91.2 },
        { hour: "16:00", auth_rate: 86.3, baseline_14d: 91.1 },
        { hour: "17:00", auth_rate: 88.4, baseline_14d: 91.2 },
      ],
    },
    {
      id: "tc_02",
      name: "run_sql",
      purpose: "Decline mix in the drop window by code × gateway",
      elapsedMs: 24,
      sql: `SELECT decline_code, gateway_id, fail_share, attempt_count
FROM v_decline_code_hourly
WHERE attempted_at >= '2026-09-15 15:00'
  AND attempted_at <  '2026-09-15 17:00'
ORDER BY fail_share DESC
LIMIT 8;`,
      rows: [
        {
          decline_code: "GATEWAY_TIMEOUT",
          gateway_id: "stripe_connect_eu",
          fail_share: 6.1,
          attempt_count: 18420,
        },
        {
          decline_code: "ISSUER_REJECTION",
          gateway_id: "stripe_connect_eu",
          fail_share: 2.7,
          attempt_count: 18420,
        },
        {
          decline_code: "DECLINE_INSUFFICIENT_FUNDS",
          gateway_id: "adyen_us",
          fail_share: 2.1,
          attempt_count: 22104,
        },
        {
          decline_code: "DO_NOT_HONOR",
          gateway_id: "checkout_uk",
          fail_share: 0.8,
          attempt_count: 9102,
        },
      ],
    },
    {
      id: "tc_03",
      name: "list_events",
      purpose: "Deploys and outages overlapping window − 36h",
      elapsedMs: 7,
      rows: [
        {
          started_at: "2026-09-14 18:40",
          kind: "deploy",
          entity: "stripe_connect_eu",
          summary: "gw-timeout-retry-v2: increase acquire timeout, collapse retries",
        },
        {
          started_at: "2026-09-16 09:10",
          kind: "competitor_outage",
          entity: "Competitor_Site_Downtime",
          summary: "Wednesday — outside the drop window",
        },
      ],
    },
    {
      id: "tc_04",
      name: "estimate_counterfactual",
      purpose: "Auth rate if stripe_connect_eu attempts are excluded",
      elapsedMs: 11,
      rows: [
        {
          observed_auth_rate: 86.2,
          projected_auth_rate: 90.4,
          recovery_pp: 4.3,
        },
      ],
    },
  ],
};

const outOfSlice: AnalyzeResult = {
  kind: "out_of_slice",
  steps: ["Checked whether this question maps to auth-rate diagnosis in the seeded book."],
  headline: "Not in this slice",
  narrative:
    "This prototype diagnoses authorization-rate movement on the synthetic book. Settlement, chargebacks, FX, and live processor files are out of scope until the Tuesday auth-rate story is crisp.",
  citations: [],
  hourly: [],
  tools: [],
  action: "Ask about authorization rate last Tuesday to see the intended demo.",
};

const unclear: AnalyzeResult = {
  kind: "unclear",
  steps: ["Could not bind the question to a metric and time window."],
  headline: "Need a metric and a time",
  narrative:
    "Ask about authorization rate (not settlement) and a day or window. The planted incident is last Tuesday’s ~5% auth-rate drop.",
  citations: [],
  hourly: [],
  tools: [],
};

export const suggestedPrompts = [
  GOLDEN_QUESTION,
  "Was Tuesday’s drop issuer-driven or a gateway issue?",
  "Why did we lose settlement on Friday?",
];

export function analyzeQuestion(question: string): AnalyzeResult {
  const q = question.trim().toLowerCase();
  if (!q) return unclear;

  if (
    /settlement|chargeback|charge back|fx |foreign exchange|3ds|who is our riskiest/.test(
      q
    )
  ) {
    return outOfSlice;
  }

  if (
    /auth|authorization|authorisation|timeout|gateway|tuesday|drop|decline|issuer/.test(
      q
    )
  ) {
    return diagnosis;
  }

  return unclear;
}

export { GOLDEN_QUESTION };
