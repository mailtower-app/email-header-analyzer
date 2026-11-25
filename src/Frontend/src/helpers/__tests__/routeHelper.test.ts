import { describe, expect, it } from 'vitest';

import { formatHelper } from '@/helpers/formatHelper';
import { mailHelper } from '@/helpers/mailHelper';
import { routeHelper } from '@/helpers/routeHelper';

function parseReceived(headerData: string) {
  return mailHelper.parseReceivedHeader({ headerName: 'Received', headerData, headerIndex: 0 });
}

describe('describeHop', () => {
  it('reads the tls version from the comment', () => {
    const hop = parseReceived(
      'from a.example.com (a.example.com [192.0.2.1]) by b.example.org with ESMTPS id abc (version=TLS1_3 cipher=TLS_AES_128_GCM_SHA256 bits=128/128); Tue, 24 Nov 2026 09:12:05 +0000',
    );

    expect(routeHelper.describeHop(hop)).toEqual({
      protocol: 'ESMTPS',
      encryption: 'Encrypted · TLS 1.3',
      authenticated: false,
    });
  });

  it('reads the tls version of Microsoft and removes the comment of the protocol', () => {
    const hop = parseReceived(
      'from a.example.com (2603:10a6::1) by b.example.com (2603:10a6::2) with Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.1.1; Tue, 24 Nov 2026 09:12:05 +0000',
    );

    expect(routeHelper.describeHop(hop)).toEqual({
      protocol: 'Microsoft SMTP Server',
      encryption: 'Encrypted · TLS 1.2',
      authenticated: false,
    });
  });

  it('detects encryption and login from the protocol', () => {
    const hop = parseReceived(
      'from a.example.com by b.example.org (Postfix) with ESMTPSA id 4F1A; Tue, 24 Nov 2026 09:12:05 +0000',
    );

    expect(routeHelper.describeHop(hop)).toEqual({
      protocol: 'ESMTPSA',
      encryption: 'Encrypted',
      authenticated: true,
    });
  });

  it('does not claim anything about the encryption of plain smtp', () => {
    const hop = parseReceived(
      'from a.example.com by b.example.org with SMTP id a1; Tue, 24 Nov 2026 09:12:05 +0000',
    );

    expect(routeHelper.describeHop(hop)).toEqual({ protocol: 'SMTP', authenticated: false });
  });

  it('handles a hop without protocol', () => {
    expect(routeHelper.describeHop(parseReceived('(qmail 123 invoked by uid 89)'))).toEqual({
      authenticated: false,
    });
  });
});

describe('delays', () => {
  const first = parseReceived('from a by b with SMTP; Tue, 24 Nov 2026 09:12:05 +0000');
  const second = parseReceived('from b by c with SMTP; Tue, 24 Nov 2026 09:14:10 +0000');
  const third = parseReceived('from c by d with SMTP; Tue, 24 Nov 2026 09:27:40 +0000');
  const withoutDate = parseReceived('from c by d with SMTP');

  it('calculates the delay between two hops', () => {
    expect(routeHelper.getDelayInSeconds(first, second)).toBe(125);
    expect(routeHelper.getDelayInSeconds(undefined, first)).toBeUndefined();
    expect(routeHelper.getDelayInSeconds(first, withoutDate)).toBeUndefined();
  });

  it('calculates the total duration', () => {
    expect(routeHelper.getTotalSeconds([first, second, third])).toBe(935);
    expect(routeHelper.getTotalSeconds([first, withoutDate])).toBeUndefined();
    expect(routeHelper.getTotalSeconds([])).toBeUndefined();
  });

  it('rates the delay', () => {
    expect(routeHelper.getDelayLevel(5)).toBe('normal');
    expect(routeHelper.getDelayLevel(125)).toBe('slow');
    expect(routeHelper.getDelayLevel(810)).toBe('very-slow');
    expect(routeHelper.getDelayLevel(undefined)).toBe('normal');
    expect(routeHelper.getDelayLevel(-3)).toBe('normal');
  });
});

describe('formatHelper', () => {
  it('formats durations', () => {
    expect(formatHelper.formatDuration(5)).toBe('5 s');
    expect(formatHelper.formatDuration(2.5)).toBe('2.5 s');
    expect(formatHelper.formatDuration(125)).toBe('2 min 5 s');
    expect(formatHelper.formatDuration(7500)).toBe('2 h 5 min');
    expect(formatHelper.formatDuration(-3)).toBe('−3 s');
  });

  it('formats dates in utc', () => {
    const date = new Date('2026-11-24T01:12:05-08:00');

    expect(formatHelper.formatTime(date)).toBe('09:12:05');
    expect(formatHelper.formatDateTime(date)).toBe('Tue, 24 Nov 2026, 09:12:05 UTC');
    expect(formatHelper.formatTime(undefined)).toBe('');
    expect(formatHelper.formatDateTime(new Date('invalid'))).toBe('');
  });
});

describe('mail addresses', () => {
  it('parses name and address', () => {
    expect(mailHelper.parseMailAddresses('Example Billing <billing@Example.com>')).toEqual([
      { name: 'Example Billing', address: 'billing@Example.com', domain: 'example.com' },
    ]);
    expect(mailHelper.parseMailAddresses('<bounce@other.example.net>')).toEqual([
      { address: 'bounce@other.example.net', domain: 'other.example.net' },
    ]);
    expect(mailHelper.parseMailAddresses('anna@example.org')).toEqual([
      { address: 'anna@example.org', domain: 'example.org' },
    ]);
  });

  it('parses a list of addresses', () => {
    expect(
      mailHelper.parseMailAddresses('"Doe, Jane" <jane@example.org>, john@example.org'),
    ).toEqual([
      { name: 'Doe, Jane', address: 'jane@example.org', domain: 'example.org' },
      { address: 'john@example.org', domain: 'example.org' },
    ]);
  });

  it('handles missing and unusual values', () => {
    expect(mailHelper.parseMailAddresses(undefined)).toEqual([]);
    expect(mailHelper.parseMailAddresses('  ')).toEqual([]);
    expect(mailHelper.parseMailAddresses('<>')).toEqual([{ address: '' }]);
    expect(mailHelper.parseMailAddresses('undisclosed-recipients:;')).toEqual([
      { address: 'undisclosed-recipients:;' },
    ]);
  });

  it('compares domains', () => {
    expect(mailHelper.isSameOrSubdomain('example.com', 'EXAMPLE.com')).toBe(true);
    expect(mailHelper.isSameOrSubdomain('bounces.example.com', 'example.com')).toBe(true);
    expect(mailHelper.isSameOrSubdomain('example.com', 'mail.example.com')).toBe(true);
    expect(mailHelper.isSameOrSubdomain('other.example.net', 'example.com')).toBe(false);
    expect(mailHelper.isSameOrSubdomain('notexample.com', 'example.com')).toBe(false);
    expect(mailHelper.isSameOrSubdomain(undefined, 'example.com')).toBe(false);
  });
});
