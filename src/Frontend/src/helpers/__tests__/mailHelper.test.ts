import { describe, expect, it } from 'vitest';

import { mailHelper } from '@/helpers/mailHelper';

function parseReceived(headerData: string) {
  return mailHelper.parseReceivedHeader({
    headerName: 'Received',
    headerData,
    headerIndex: 0,
  });
}

describe('splitMailHeader', () => {
  it('splits header fields and unfolds continuation lines', () => {
    const headers = mailHelper.splitMailHeader(
      [
        'Received: from a.example.com (a.example.com [192.0.2.1])',
        '        by mx.example.org with ESMTPS id abc123;',
        '\tTue, 24 Nov 2026 09:12:03 +0000',
        'Subject: Hello',
      ].join('\r\n'),
    );

    expect(headers).toEqual([
      {
        headerName: 'Received',
        headerData:
          'from a.example.com (a.example.com [192.0.2.1]) by mx.example.org with ESMTPS id abc123; Tue, 24 Nov 2026 09:12:03 +0000',
        headerIndex: 0,
      },
      { headerName: 'Subject', headerData: 'Hello', headerIndex: 1 },
    ]);
  });

  it('ignores empty lines at the beginning', () => {
    const headers = mailHelper.splitMailHeader('\n  \r\n\nSubject: Hello\nTo: you@example.org');

    expect(headers.map((header) => header.headerName)).toEqual(['Subject', 'To']);
  });

  it('stops at the empty line between header and body', () => {
    const headers = mailHelper.splitMailHeader('Subject: Hello\n\nBody: this is the mail text');

    expect(headers).toHaveLength(1);
  });

  it('skips a leading line that is no header field', () => {
    const headers = mailHelper.splitMailHeader(
      'Microsoft Mail Internet Headers Version 2.0\nSubject: Hello\nTo: you@example.org',
    );

    expect(headers.map((header) => header.headerName)).toEqual(['Subject', 'To']);
    expect(headers.map((header) => header.headerIndex)).toEqual([0, 1]);
  });

  it('keeps colons inside of the header data', () => {
    const headers = mailHelper.splitMailHeader('Date: Tue, 24 Nov 2026 09:12:03 +0000');

    expect(headers[0]?.headerData).toBe('Tue, 24 Nov 2026 09:12:03 +0000');
  });

  it('returns an empty list for text without header fields', () => {
    expect(mailHelper.splitMailHeader('')).toEqual([]);
    expect(mailHelper.splitMailHeader('just some text')).toEqual([]);
  });
});

describe('MIME encoded-words', () => {
  function subject(rawSubject: string): string | undefined {
    return mailHelper.splitMailHeader(`Subject: ${rawSubject}`)[0]?.headerData;
  }

  it('decodes base64', () => {
    expect(subject('=?UTF-8?B?R3LDvMOfZQ==?=')).toBe('Grüße');
  });

  it('decodes quoted-printable', () => {
    expect(subject('=?utf-8?Q?Gr=C3=BC=C3=9Fe_aus_Wien?=')).toBe('Grüße aus Wien');
  });

  it('decodes other charsets', () => {
    expect(subject('=?iso-8859-1?Q?Gr=FC=DFe?=')).toBe('Grüße');
  });

  it('removes the whitespace between two encoded-words', () => {
    expect(subject('=?utf-8?Q?Hello_?= =?utf-8?Q?World?=')).toBe('Hello World');
    expect(subject('=?utf-8?Q?Hello?=\n =?utf-8?Q?World?=')).toBe('HelloWorld');
  });

  it('keeps the whitespace between an encoded-word and plain text', () => {
    expect(subject('Re: =?utf-8?Q?Gr=C3=BC=C3=9Fe?= aus Wien')).toBe('Re: Grüße aus Wien');
  });

  it('keeps an encoded-word with an unknown charset and still parses the other headers', () => {
    const headers = mailHelper.splitMailHeader(
      'Subject: =?x-unknown?Q?Hello?=\nTo: =?utf-8?B?!!!?= <you@example.org>\nFrom: me@example.org',
    );

    expect(headers.map((header) => header.headerData)).toEqual([
      '=?x-unknown?Q?Hello?=',
      '=?utf-8?B?!!!?= <you@example.org>',
      'me@example.org',
    ]);
  });
});

describe('filterHeaders', () => {
  const headers = mailHelper.splitMailHeader(
    'Message-ID: <1@example.org>\nreturn-path: <a@example.org>\nSubject: Hello',
  );

  it('compares header names case-insensitive', () => {
    expect(mailHelper.filterHeaders(headers, 'Message-Id')).toHaveLength(1);
    expect(mailHelper.filterHeaders(headers, 'Return-Path')[0]?.headerData).toBe('<a@example.org>');
  });

  it('returns an empty list if there are no headers', () => {
    expect(mailHelper.filterHeaders(undefined, 'Subject')).toEqual([]);
    expect(mailHelper.filterHeaders(headers, 'To')).toEqual([]);
  });
});

describe('parseReceivedHeader', () => {
  it('parses a Gmail hop', () => {
    const received = parseReceived(
      'from mail-ej1-f48.example.com (mail-ej1-f48.example.com. [192.0.2.48]) by mx.google.com with ESMTPS id a640c23a62f3a-abc123si12345666b.123.2026.11.24.01.12.02 for <you@gmail.com> (version=TLS1_3 cipher=TLS_AES_128_GCM_SHA256 bits=128/128); Tue, 24 Nov 2026 01:12:03 -0800 (PST)',
    );

    expect(received.fromDomain).toBe('mail-ej1-f48.example.com');
    expect(received.fromIpAddress).toBe('192.0.2.48');
    expect(received.byDomain).toBe('mx.google.com');
    expect(received.byIpAddress).toBe('');
    expect(received.with).toBe('ESMTPS');
    expect(received.id).toBe('a640c23a62f3a-abc123si12345666b.123.2026.11.24.01.12.02');
    expect(received.for).toBe(
      '<you@gmail.com> (version=TLS1_3 cipher=TLS_AES_128_GCM_SHA256 bits=128/128)',
    );
    expect(received.dateTime?.toISOString()).toBe('2026-11-24T09:12:03.000Z');
  });

  it('parses a Microsoft 365 hop', () => {
    const received = parseReceived(
      'from AM0PR01MB1234.eurprd01.prod.exchangelabs.com (2603:10a6:208:1::10) by AS8PR01MB5678.eurprd01.prod.exchangelabs.com (2603:10a6:20b:2::20) with Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.9343.11 via Frontend Transport; Tue, 24 Nov 2026 09:12:01 +0000',
    );

    expect(received.fromDomain).toBe('AM0PR01MB1234.eurprd01.prod.exchangelabs.com');
    expect(received.fromIpAddress).toBe('2603:10a6:208:1::10');
    expect(received.byDomain).toBe('AS8PR01MB5678.eurprd01.prod.exchangelabs.com');
    expect(received.byIpAddress).toBe('2603:10a6:20b:2::20');
    expect(received.with).toBe(
      'Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384)',
    );
    expect(received.id).toBe('15.20.9343.11');
    expect(received.via).toBe('Frontend Transport');
  });

  it('removes the IPv6 prefix of the ip address', () => {
    const received = parseReceived(
      'from a.example.com ([IPv6:2001:db8::1]) by b.example.org with ESMTP; Tue, 24 Nov 2026 09:12:01 +0000',
    );

    expect(received.fromIpAddress).toBe('2001:db8::1');
  });

  it('does not use a comment without ip address as ip address', () => {
    const received = parseReceived(
      'from a.example.com (a.example.com [192.0.2.1]) by b.example.org (Postfix) with ESMTPS id 4F1A2B3C for <you@example.org>; Tue, 24 Nov 2026 09:12:01 +0000',
    );

    expect(received.byDomain).toBe('b.example.org');
    expect(received.byIpAddress).toBe('');
    expect(received.id).toBe('4F1A2B3C');
    expect(received.for).toBe('<you@example.org>');
  });

  it('parses a hop without from', () => {
    const received = parseReceived(
      'by 2002:a05:6402:1234:b0:123:4567:89ab with SMTP id x1csp123456; Tue, 24 Nov 2026 01:12:03 -0800 (PST)',
    );

    expect(received.fromDomain).toBeUndefined();
    expect(received.byDomain).toBe('2002:a05:6402:1234:b0:123:4567:89ab');
    expect(received.with).toBe('SMTP');
    expect(received.id).toBe('x1csp123456');
  });

  it('ignores keywords inside of comments and words', () => {
    const received = parseReceived(
      'from standby.example.com (helo=valid for example) by forward.example.org (Postfix, from userid 1000) id 1AB2C3; Tue, 24 Nov 2026 09:12:01 +0000',
    );

    expect(received.fromDomain).toBe('standby.example.com');
    expect(received.byDomain).toBe('forward.example.org');
    expect(received.id).toBe('1AB2C3');
    expect(received.for).toBeUndefined();
  });

  it('parses a qmail hop without clauses', () => {
    const received = parseReceived('(qmail 12345 invoked by uid 89); 24 Nov 2026 09:12:01 -0000');

    expect(received.byDomain).toBeUndefined();
    expect(received.dateTime?.toISOString()).toBe('2026-11-24T09:12:01.000Z');
  });

  it('has no date if the date is missing or invalid', () => {
    expect(
      parseReceived('from a.example.com by b.example.org with ESMTP').dateTime,
    ).toBeUndefined();
    expect(
      parseReceived('from a.example.com by b.example.org with ESMTP; not a date').dateTime,
    ).toBeUndefined();
  });

  it('returns only the raw header if there is no data', () => {
    expect(parseReceived('')).toEqual({
      rawHeaderDetails: {
        headerName: 'Received',
        headerData: '',
        headerIndex: 0,
      },
    });
  });
});
