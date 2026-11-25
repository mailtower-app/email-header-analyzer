import { describe, expect, it } from 'vitest';

import { authenticationHelper } from '@/helpers/authenticationHelper';

const google =
  'mx.google.com; dkim=pass header.i=@example.com header.s=mail2026 header.b=AbCd; spf=pass (google.com: domain of billing@example.com designates 192.0.2.48 as permitted sender) smtp.mailfrom=billing@example.com; dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=example.com';

const microsoft =
  'spf=pass (sender IP is 192.0.2.48) smtp.mailfrom=example.com; dkim=pass (signature was verified) header.d=example.com;dmarc=pass action=none header.from=example.com;compauth=pass reason=100';

const failed =
  'mx.example.org; dkim=none; spf=softfail (example.org: domain of transitioning bounce@other.example.net does not designate 203.0.113.9 as permitted sender) smtp.mailfrom=bounce@other.example.net; dmarc=fail (p=NONE sp=NONE dis=NONE) header.from=example.com';

describe('parseAuthenticationSummary', () => {
  it('parses the format of Google', () => {
    expect(authenticationHelper.parseAuthenticationSummary(google)).toEqual({
      checkedBy: 'mx.google.com',
      spf: { status: 'pass', domain: 'billing@example.com', ipAddress: '192.0.2.48' },
      dkim: { status: 'pass', domain: 'example.com', selector: 'mail2026' },
      dmarc: { status: 'pass', domain: 'example.com', policy: 'reject' },
    });
  });

  it('parses the format of Microsoft', () => {
    expect(authenticationHelper.parseAuthenticationSummary(microsoft)).toEqual({
      spf: { status: 'pass', domain: 'example.com', ipAddress: '192.0.2.48' },
      dkim: { status: 'pass', domain: 'example.com' },
      dmarc: { status: 'pass', domain: 'example.com' },
    });
  });

  it('parses failed results', () => {
    const summary = authenticationHelper.parseAuthenticationSummary(failed);

    expect(summary.spf).toEqual({
      status: 'softfail',
      domain: 'bounce@other.example.net',
      ipAddress: '203.0.113.9',
    });
    expect(summary.dkim).toEqual({ status: 'none' });
    expect(summary.dmarc).toEqual({ status: 'fail', domain: 'example.com', policy: 'none' });
  });

  it('prefers a passed result if there are several signatures', () => {
    const summary = authenticationHelper.parseAuthenticationSummary(
      'mx.example.org; dkim=fail header.d=list.example.net; dkim=pass header.d=example.com; dkim=fail header.d=other.example.net',
    );

    expect(summary.dkim).toEqual({ status: 'pass', domain: 'example.com' });
  });

  it('returns an empty summary without header', () => {
    expect(authenticationHelper.parseAuthenticationSummary(undefined)).toEqual({});
    expect(authenticationHelper.parseAuthenticationSummary('mx.example.org; none')).toEqual({
      checkedBy: 'mx.example.org',
    });
  });
});

describe('getCheckState', () => {
  it('maps the status to a state', () => {
    expect(authenticationHelper.getCheckState({ status: 'pass' })).toBe('passed');
    expect(authenticationHelper.getCheckState({ status: 'softfail' })).toBe('failed');
    expect(authenticationHelper.getCheckState({ status: 'permerror' })).toBe('failed');
    expect(authenticationHelper.getCheckState({ status: 'none' })).toBe('unknown');
    expect(authenticationHelper.getCheckState({ status: 'neutral' })).toBe('unknown');
    expect(authenticationHelper.getCheckState(undefined)).toBe('unknown');
  });
});

describe('getVerdict', () => {
  function verdict(headerData: string | undefined, fromDomain = 'example.com') {
    return authenticationHelper.getVerdict(
      authenticationHelper.parseAuthenticationSummary(headerData),
      fromDomain,
    );
  }

  it('confirms the sender if all checks passed', () => {
    expect(verdict(google)).toMatchObject({
      level: 'passed',
      badge: 'All checks passed',
      title: 'This email really comes from example.com',
    });
  });

  it('confirms the sender if dmarc passed but spf failed', () => {
    const result = verdict(
      'mx.example.org; spf=fail smtp.mailfrom=example.com; dkim=pass header.d=example.com; dmarc=pass header.from=example.com',
    );

    expect(result.level).toBe('passed');
    expect(result.badge).toBe('DMARC passed · 2 of 3 checks');
  });

  it('warns if dmarc failed', () => {
    expect(verdict(failed)).toMatchObject({
      level: 'failed',
      badge: '2 of 3 checks failed',
      title: 'Be careful: this email may not come from example.com',
    });
  });

  it('warns if spf failed and there is no dmarc result', () => {
    expect(verdict('mx.example.org; spf=fail smtp.mailfrom=example.com').level).toBe('failed');
  });

  it('does not confirm the sender without dmarc', () => {
    const result = verdict(
      'mx.example.org; spf=pass smtp.mailfrom=example.com; dkim=pass header.d=example.com',
    );

    expect(result.level).toBe('unknown');
    expect(result.badge).toBe('2 of 3 checks passed');
  });

  it('reports missing checks', () => {
    expect(verdict(undefined)).toMatchObject({ level: 'unknown', badge: 'No checks found' });
  });
});
