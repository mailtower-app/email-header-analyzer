export type AuthenticationMethod = 'spf' | 'dkim' | 'dmarc';
export type CheckState = 'passed' | 'failed' | 'unknown';

export interface AuthenticationCheck {
  status: string;
  /** The checked domain or mail address */
  domain?: string;
  /** dkim: the selector of the signature */
  selector?: string;
  /** dmarc: the policy of the sender domain, for example "reject" */
  policy?: string;
  /** spf: the ip address of the sending server */
  ipAddress?: string;
}

export interface AuthenticationSummary {
  /** The mail server that has checked the email */
  checkedBy?: string;
  spf?: AuthenticationCheck;
  dkim?: AuthenticationCheck;
  dmarc?: AuthenticationCheck;
}

export interface Verdict {
  level: CheckState;
  badge: string;
  title: string;
  text: string;
}

const methods: AuthenticationMethod[] = ['spf', 'dkim', 'dmarc'];
const failedStatuses = ['fail', 'softfail', 'hardfail', 'permerror', 'temperror', 'policy'];

function firstMatch(text: string, regex: RegExp): string | undefined {
  return text.match(regex)?.[1];
}

function parseCheck(method: AuthenticationMethod, result: string, status: string) {
  const check: AuthenticationCheck = { status };

  const comment = firstMatch(result, /\(([^)]*)\)/) ?? '';
  // The comment can contain the same properties, only use the text around it
  const properties = result.replace(/\([^)]*\)/g, ' ');

  let domain: string | undefined = undefined;

  if (method === 'spf') {
    domain = firstMatch(properties, /\bsmtp\.(?:mailfrom|helo)=([^\s;]+)/i);

    const ipAddress = firstMatch(
      `${comment} ${properties}`,
      /(?:designates?|sender IP is|client-ip=)\s*([0-9a-f.:]*[0-9a-f])/i,
    );
    if (ipAddress) {
      check.ipAddress = ipAddress;
    }
  }

  if (method === 'dkim') {
    domain =
      firstMatch(properties, /\bheader\.d=([^\s;]+)/i) ??
      firstMatch(properties, /\bheader\.i=[^\s;@]*@([^\s;]+)/i);

    const selector = firstMatch(properties, /\bheader\.s=([^\s;]+)/i);
    if (selector) {
      check.selector = selector;
    }
  }

  if (method === 'dmarc') {
    domain = firstMatch(properties, /\bheader\.from=([^\s;]+)/i);

    const policy = firstMatch(comment, /\bp=([a-z]+)/i);
    if (policy) {
      check.policy = policy.toLowerCase();
    }
  }

  if (domain) {
    check.domain = domain;
  }

  return check;
}

/**
 * Reads the results of spf, dkim and dmarc from the data of an "Authentication-Results" header.
 * If there is more than one result of a method (dkim), a passed result is preferred.
 */
function parseAuthenticationSummary(headerData: string | undefined): AuthenticationSummary {
  const summary: AuthenticationSummary = {};

  if (!headerData) {
    return summary;
  }

  // Split at semicolons, but not inside of comments
  const results = headerData.split(/;(?![^(]*\))/).map((result) => result.trim());

  // The first part is the name of the checking server, if it is no result
  const firstResult = results[0];
  if (firstResult && !firstResult.includes('=')) {
    const checkedBy = firstResult.split(/\s/)[0];
    if (checkedBy) {
      summary.checkedBy = checkedBy;
    }
  }

  for (const result of results) {
    const match = result.match(/^(spf|dkim|dmarc)=([a-z]+)/i);
    if (!match?.[1] || !match[2]) {
      continue;
    }

    const method = match[1].toLowerCase() as AuthenticationMethod;
    const status = match[2].toLowerCase();

    if (summary[method] && status !== 'pass') {
      continue;
    }

    summary[method] = parseCheck(method, result, status);
  }

  return summary;
}

function getCheckState(check: AuthenticationCheck | undefined): CheckState {
  if (check?.status === 'pass') {
    return 'passed';
  }

  if (check && failedStatuses.includes(check.status)) {
    return 'failed';
  }

  return 'unknown';
}

/**
 * Summarizes the checks in one sentence.
 * @param fromDomain The domain of the visible sender (From header)
 */
function getVerdict(summary: AuthenticationSummary, fromDomain: string | undefined): Verdict {
  const states = methods.map((method) => getCheckState(summary[method]));
  const passedCount = states.filter((state) => state === 'passed').length;
  const failedCount = states.filter((state) => state === 'failed').length;
  const dmarcState = getCheckState(summary.dmarc);
  const senderDomain = summary.dmarc?.domain ?? fromDomain ?? 'the named sender';

  if (!summary.spf && !summary.dkim && !summary.dmarc) {
    return {
      level: 'unknown',
      badge: 'No checks found',
      title: 'This header does not say whether the email is authentic',
      text: 'The receiving server did not record the results of SPF, DKIM and DMARC. The route of the email is shown below.',
    };
  }

  // DMARC passes if SPF or DKIM passed for the domain of the visible sender
  if (dmarcState === 'passed') {
    return {
      level: 'passed',
      badge: passedCount === 3 ? 'All checks passed' : `DMARC passed · ${passedCount} of 3 checks`,
      title: `This email really comes from ${senderDomain}`,
      text:
        passedCount === 3
          ? 'The sending server is allowed, the signature is valid and the sender domain matches.'
          : 'The sender domain was confirmed by DMARC. Not every single check passed, this happens for example with forwarded emails.',
    };
  }

  if (failedCount > 0) {
    return {
      level: 'failed',
      badge: `${failedCount} of 3 checks failed`,
      title: `Be careful: this email may not come from ${senderDomain}`,
      text: 'The receiving server could not confirm the sender. Do not open links or attachments if you do not expect this email.',
    };
  }

  return {
    level: 'unknown',
    badge: `${passedCount} of 3 checks passed`,
    title: 'The sender of this email is not fully confirmed',
    text: 'No check failed, but the sender domain was not confirmed by DMARC.',
  };
}

export const authenticationHelper = {
  parseAuthenticationSummary,
  getCheckState,
  getVerdict,
};
