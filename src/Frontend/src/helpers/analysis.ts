import type { HeaderDetails } from 'src/models/HeaderDetails';
import type { ReceivedHeaderParts } from 'src/models/ReceivedHeaderParts';
import { formatDuration } from 'src/helpers/dateFormat';

/**
 * Turns already-parsed header data into a ranked list of findings.
 *
 * This module reads only what `mailHelper` and `AnalyzerPage` already produce
 * (header parts + parsed Received hops) plus a light regex read of the raw
 * Authentication-Results string. It does not re-parse the message and adds no
 * dependencies — every rule is a pure string/date comparison.
 */

export type Severity = 'pass' | 'info' | 'warn' | 'fail';

/** A short alignment/mismatch note shown on a summary card. */
export interface AlignHint {
  severity: Severity;
  text: string;
}

export type FindingCategory = 'auth' | 'chain' | 'identity' | 'timing';

export interface Finding {
  id: string;
  severity: Severity;
  category: FindingCategory;
  /** Plain-language, one line. */
  title: string;
  /** One sentence of context. */
  description: string;
  /** Verbatim slice of the header the rule fired on. */
  evidence?: string | undefined;
  /** Anchor id of the section that shows the underlying data. */
  sectionRef: string;
}

export interface AnalysisInput {
  headers: HeaderDetails[] | undefined;
  received: ReceivedHeaderParts[] | undefined;
}

export interface AnalysisResult {
  findings: Finding[];
  counts: Record<Severity, number>;
  worst: Severity;
}

/** Tunable thresholds — one place to adjust the analysis. */
export const ANALYSIS_CONFIG = {
  hopDelayWarnSeconds: 5 * 60,
  clockSkewInfoSeconds: 60,
  dateDriftInfoSeconds: 60 * 60,
} as const;

const SEVERITY_ORDER: Severity[] = ['pass', 'info', 'warn', 'fail'];

function isValidDate(d: Date | undefined): d is Date {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

function findHeader(headers: HeaderDetails[], name: string): HeaderDetails | undefined {
  const lower = name.toLowerCase();
  return headers.find((h) => h.headerName.toLowerCase() === lower);
}

function findHeaders(headers: HeaderDetails[], name: string): HeaderDetails[] {
  const lower = name.toLowerCase();
  return headers.filter((h) => h.headerName.toLowerCase() === lower);
}

/** Best-effort domain extraction from an address, angle-addr, or bare host. */
export function domainOf(raw: string | undefined): string | undefined {
  if (!raw) return undefined;

  const angle = raw.match(/<([^>]*)>/);
  const candidate = angle?.[1] ?? raw;

  const at = candidate.match(/@([A-Za-z0-9.\-_]+)/);
  let domain = (at?.[1] ?? candidate).trim().toLowerCase();
  domain = domain.replace(/^[<("']+/, '').replace(/[>)."'\s.]+$/, '');

  if (!domain || domain.includes(' ') || !domain.includes('.')) return undefined;
  return domain;
}

function registrableDomain(domain: string | undefined): string | undefined {
  if (!domain) return undefined;
  const parts = domain.split('.');
  if (parts.length <= 2) return domain;
  return parts.slice(-2).join('.');
}

export function sameOrg(a: string | undefined, b: string | undefined): boolean {
  const ra = registrableDomain(a);
  const rb = registrableDomain(b);
  return !!ra && !!rb && ra === rb;
}

// --- Authentication-Results -------------------------------------------------

const AUTH_MECHANISMS = ['spf', 'dkim', 'dmarc', 'compauth'] as const;
type AuthMechanism = (typeof AUTH_MECHANISMS)[number];

function authStatus(text: string, mechanism: AuthMechanism): string | undefined {
  const matches = [...text.matchAll(new RegExp(`\\b${mechanism}=([A-Za-z]+)`, 'gi'))]
    .map((m) => m[1])
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.toLowerCase());
  if (matches.length === 0) return undefined;
  // If any Authentication-Results header reports a pass, treat it as passing.
  return matches.includes('pass') ? 'pass' : matches[0];
}

function authEvidence(text: string, mechanism: AuthMechanism): string | undefined {
  const m = text.match(new RegExp(`\\b${mechanism}=[^;\\n]+`, 'i'));
  return m?.[0]?.trim();
}

function analyzeAuthentication(headers: HeaderDetails[], findings: Finding[]): void {
  const arHeaders = findHeaders(headers, 'Authentication-Results');

  if (arHeaders.length === 0) {
    findings.push({
      id: 'auth-no-results',
      severity: 'warn',
      category: 'auth',
      title: 'No Authentication-Results header',
      description:
        'The receiving server did not record SPF, DKIM or DMARC results, so authentication cannot be verified from this message.',
      sectionRef: 'authentication',
    });
    return;
  }

  const text = arHeaders.map((h) => h.headerData).join('\n');
  const statuses: Partial<Record<AuthMechanism, string>> = {};

  for (const mechanism of AUTH_MECHANISMS) {
    const status = authStatus(text, mechanism);
    if (!status) continue;
    statuses[mechanism] = status;

    const label = mechanism.toUpperCase();
    const evidence = authEvidence(text, mechanism);

    if (status === 'pass') {
      findings.push({
        id: `auth-${mechanism}-pass`,
        severity: 'pass',
        category: 'auth',
        title: `${label} passed`,
        description: `${label} verification succeeded.`,
        evidence,
        sectionRef: 'authentication',
      });
    } else if (mechanism === 'compauth') {
      findings.push({
        id: 'auth-compauth-fail',
        severity: 'warn',
        category: 'auth',
        title: `Composite authentication did not pass (${status})`,
        description:
          'The receiver’s combined authentication check flagged this message. Often paired with an SPF or DKIM problem.',
        evidence,
        sectionRef: 'authentication',
      });
    } else {
      findings.push({
        id: `auth-${mechanism}-fail`,
        severity: 'fail',
        category: 'auth',
        title: `${label} did not pass (${status})`,
        description: `${label} authentication returned "${status}" instead of "pass".`,
        evidence,
        sectionRef: 'authentication',
      });
    }
  }

  if (
    statuses.dmarc === 'pass' &&
    statuses.spf &&
    statuses.spf !== 'pass' &&
    statuses.dkim &&
    statuses.dkim !== 'pass'
  ) {
    findings.push({
      id: 'auth-dmarc-alignment',
      severity: 'fail',
      category: 'auth',
      title: 'DMARC reports pass but neither SPF nor DKIM aligned',
      description:
        'DMARC needs at least one aligned, passing mechanism. With both SPF and DKIM failing, a "pass" here is inconsistent and worth distrusting.',
      evidence: authEvidence(text, 'dmarc'),
      sectionRef: 'authentication',
    });
  }

  if (!statuses.dmarc && (statuses.spf || statuses.dkim)) {
    findings.push({
      id: 'auth-dmarc-missing',
      severity: 'info',
      category: 'auth',
      title: 'No DMARC result reported',
      description:
        'SPF or DKIM was evaluated but DMARC was not, so domain alignment for the visible From address is unverified.',
      sectionRef: 'authentication',
    });
  }
}

// --- Identity headers -----------------------------------------------------

function analyzeIdentity(headers: HeaderDetails[], findings: Finding[]): void {
  const fromHeader = findHeader(headers, 'From');
  const fromDomain = domainOf(fromHeader?.headerData);
  if (!fromHeader || !fromDomain) return;

  const checks: Array<{
    name: string;
    severity: Severity;
    id: string;
    describe: (other: string) => string;
  }> = [
    {
      name: 'Return-Path',
      severity: 'warn',
      id: 'identity-return-path',
      describe: (o) =>
        `Bounces go to ${o}, a different domain than the visible sender ${fromDomain}. Common in third-party sending, also a spoofing tell.`,
    },
    {
      name: 'Reply-To',
      severity: 'warn',
      id: 'identity-reply-to',
      describe: (o) =>
        `Replies would be addressed to ${o} rather than ${fromDomain}. Worth confirming this is intentional.`,
    },
    {
      name: 'Message-Id',
      severity: 'info',
      id: 'identity-message-id',
      describe: (o) =>
        `The Message-ID was generated on ${o}, not ${fromDomain}. Normal for some senders; noted for completeness.`,
    },
  ];

  for (const check of checks) {
    const header = findHeader(headers, check.name);
    const otherDomain = domainOf(header?.headerData);
    if (!header || !otherDomain || sameOrg(otherDomain, fromDomain)) continue;

    findings.push({
      id: check.id,
      severity: check.severity,
      category: 'identity',
      title: `${check.name} domain differs from From`,
      description: check.describe(otherDomain),
      evidence: `From: ${fromHeader.headerData}\n${check.name}: ${header.headerData}`,
      sectionRef: 'summary',
    });
  }

  // Display-name spoofing: an address embedded in the display name that
  // resolves to a different domain than the real From address.
  const emails = fromHeader.headerData.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g);
  if (emails && emails.length >= 2) {
    const realDomain = domainOf(emails[emails.length - 1]);
    const spoofed = emails
      .slice(0, -1)
      .map((e) => domainOf(e))
      .find((d) => d && !sameOrg(d, realDomain));

    if (spoofed) {
      findings.push({
        id: 'identity-display-name-spoof',
        severity: 'warn',
        category: 'identity',
        title: 'From display name contains a different email address',
        description: `The name shows an address at ${spoofed} while the message is actually from ${realDomain}. A classic impersonation pattern.`,
        evidence: `From: ${fromHeader.headerData}`,
        sectionRef: 'summary',
      });
    }
  }
}

// --- Received chain & timing --------------------------------------------

function analyzeChain(
  headers: HeaderDetails[],
  received: ReceivedHeaderParts[] | undefined,
  findings: Finding[],
): void {
  const hasReceivedRaw = findHeaders(headers, 'Received').length > 0;

  if ((!received || received.length === 0) && hasReceivedRaw) {
    findings.push({
      id: 'chain-unparsed',
      severity: 'info',
      category: 'chain',
      title: 'Received headers could not be parsed into hops',
      description: 'The message has Received lines but none produced a usable hop.',
      sectionRef: 'hops',
    });
    return;
  }
  if (!received || received.length === 0) return;

  // AnalyzerPage hands hops over oldest-first (it sorts headerIndex
  // descending, and the newest Received line has the lowest index), matching
  // what MailFlow / MailFlowTable rely on. If every hop is dated, sort by time
  // as well so the timing rules do not depend on that upstream ordering.
  const chrono = [...received];
  if (chrono.every((h) => isValidDate(h.dateTime))) {
    chrono.sort((a, b) => (a.dateTime?.getTime() ?? 0) - (b.dateTime?.getTime() ?? 0));
  }

  const undated = chrono.filter((h) => !isValidDate(h.dateTime)).length;
  if (undated > 0) {
    findings.push({
      id: 'chain-missing-timestamps',
      severity: 'info',
      category: 'timing',
      title:
        undated === 1
          ? '1 hop has no readable timestamp'
          : `${undated} hops have no readable timestamp`,
      description: 'Transit time cannot be computed across those hops.',
      sectionRef: 'hops',
    });
  }

  for (let i = 1; i < chrono.length; i++) {
    const prev = chrono[i - 1]!.dateTime;
    const curr = chrono[i]!.dateTime;
    if (!isValidDate(prev) || !isValidDate(curr)) continue;

    const deltaSeconds = (curr.getTime() - prev.getTime()) / 1000;
    const fromHost = chrono[i - 1]!.byDomain || chrono[i - 1]!.rawHeaderDetails.headerData;
    const toHost = chrono[i]!.byDomain || chrono[i]!.rawHeaderDetails.headerData;

    if (deltaSeconds > ANALYSIS_CONFIG.hopDelayWarnSeconds) {
      findings.push({
        id: `chain-delay-${i}`,
        severity: 'warn',
        category: 'timing',
        title: `Unusual delay before hop ${i + 1} (${formatDuration(deltaSeconds)})`,
        description:
          'A message normally moves between servers in under a minute. A long pause can mean greylisting, a queue backup, or a forged timestamp.',
        evidence: `${fromHost}  →  ${toHost}`,
        sectionRef: 'hops',
      });
    } else if (deltaSeconds < -ANALYSIS_CONFIG.clockSkewInfoSeconds) {
      findings.push({
        id: `chain-skew-${i}`,
        severity: 'info',
        category: 'timing',
        title: `Timestamp goes backwards at hop ${i + 1}`,
        description: `Hop ${i + 1} is dated ${formatDuration(-deltaSeconds)} before the hop that handed it off — a server clock is off.`,
        evidence: `${fromHost}  →  ${toHost}`,
        sectionRef: 'hops',
      });
    }
  }

  // Date header vs earliest hop.
  const dateHeader = findHeader(headers, 'Date');
  const claimed = dateHeader ? new Date(dateHeader.headerData) : undefined;
  const earliest = chrono.map((h) => h.dateTime).find(isValidDate);
  if (isValidDate(claimed) && isValidDate(earliest)) {
    const driftSeconds = Math.abs(earliest.getTime() - claimed.getTime()) / 1000;
    if (driftSeconds > ANALYSIS_CONFIG.dateDriftInfoSeconds) {
      findings.push({
        id: 'timing-date-drift',
        severity: 'info',
        category: 'timing',
        title: `Date header is ${formatDuration(driftSeconds)} from the first hop`,
        description:
          'The sender-supplied Date differs noticeably from when the first server actually saw the message.',
        evidence: `Date: ${dateHeader!.headerData}`,
        sectionRef: 'hops',
      });
    }
  }
}

// --- Entry point --------------------------------------------------------

export function analyzeMail(input: AnalysisInput): AnalysisResult {
  const findings: Finding[] = [];
  const headers = input.headers ?? [];

  if (headers.length > 0) {
    analyzeAuthentication(headers, findings);
    analyzeIdentity(headers, findings);
    analyzeChain(headers, input.received, findings);
  }

  findings.sort((a, b) => SEVERITY_ORDER.indexOf(b.severity) - SEVERITY_ORDER.indexOf(a.severity));

  const counts: Record<Severity, number> = { pass: 0, info: 0, warn: 0, fail: 0 };
  for (const finding of findings) counts[finding.severity]++;

  const worst = findings.reduce<Severity>(
    (acc, finding) =>
      SEVERITY_ORDER.indexOf(finding.severity) > SEVERITY_ORDER.indexOf(acc)
        ? finding.severity
        : acc,
    'pass',
  );

  return { findings, counts, worst };
}
