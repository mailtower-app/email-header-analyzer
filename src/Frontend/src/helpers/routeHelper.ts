import type { ReceivedHeaderParts } from '@/models/ReceivedHeaderParts';

export interface HopDescription {
  /** The transfer protocol without comments, for example "ESMTPS" */
  protocol?: string;
  /** Set if the header shows that the connection was encrypted, for example "Encrypted · TLS 1.3" */
  encryption?: string;
  /** The sender has logged in at the receiving server (SMTP AUTH) */
  authenticated: boolean;
}

/**
 * Describes a hop in plain words, based on the "with" clause and the comments of the header.
 * A missing encryption is not reported, many servers do not write it into the header.
 */
function describeHop(received: ReceivedHeaderParts): HopDescription {
  const description: HopDescription = { authenticated: false };

  const protocol = received.with?.replace(/\([^)]*\)/g, ' ').trim();
  if (protocol) {
    description.protocol = protocol;
  }

  // RFC 3848: ESMTPS = TLS, ESMTPA = authenticated, ESMTPSA = both
  const protocolName = protocol?.split(/\s/)[0]?.toUpperCase() ?? '';
  const isSmtpVariant = /^(E|L|UTF8L?)?SMTPS?A?$/.test(protocolName);

  description.authenticated = isSmtpVariant && protocolName.endsWith('A');

  const rawHeader = received.rawHeaderDetails.headerData;
  const tlsVersion = rawHeader.match(/\bTLS\s?v?_?(1)[._]([0-3])\b/i);
  const usesTls = /\bTLS/i.test(rawHeader) || (isSmtpVariant && /SMTPSA?$/.test(protocolName));

  if (tlsVersion) {
    description.encryption = `Encrypted · TLS ${tlsVersion[1]}.${tlsVersion[2]}`;
  } else if (usesTls) {
    description.encryption = 'Encrypted';
  }

  return description;
}

/**
 * The seconds between two hops, undefined if a date is missing.
 */
function getDelayInSeconds(
  previous: ReceivedHeaderParts | undefined,
  current: ReceivedHeaderParts,
): number | undefined {
  if (!previous?.dateTime || !current.dateTime) {
    return undefined;
  }

  return (current.dateTime.getTime() - previous.dateTime.getTime()) / 1000;
}

/**
 * The seconds between the first and the last hop, undefined with less than two dates.
 */
function getTotalSeconds(receivedHeaders: ReceivedHeaderParts[]): number | undefined {
  const times = receivedHeaders
    .map((received) => received.dateTime?.getTime())
    .filter((time) => time !== undefined);

  if (times.length < 2) {
    return undefined;
  }

  return (Math.max(...times) - Math.min(...times)) / 1000;
}

export type DelayLevel = 'normal' | 'slow' | 'very-slow';

function getDelayLevel(seconds: number | undefined): DelayLevel {
  if (seconds !== undefined && seconds >= 600) {
    return 'very-slow';
  }

  if (seconds !== undefined && seconds >= 60) {
    return 'slow';
  }

  return 'normal';
}

export const routeHelper = {
  describeHop,
  getDelayInSeconds,
  getTotalSeconds,
  getDelayLevel,
};
