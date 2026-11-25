import type { HeaderDetails } from '@/models/HeaderDetails';
import type { ReceivedHeaderParts } from '@/models/ReceivedHeaderParts';

type ReceivedClause = 'from' | 'by' | 'via' | 'with' | 'id' | 'for';

const receivedClauseRegex = /(from|by|via|with|id|for)\s/iy;
const ipAddressRegex = /^(?:\d{1,3}(?:\.\d{1,3}){3}|[0-9a-f]*:[0-9a-f:.]+)$/i;
const headerLineRegex = /^[\x21-\x39\x3b-\x7e]+[ \t]*:/;

/**
 * Splits the value of a "from" or "by" clause into the host name and the ip address.
 * Supports `host (name [1.2.3.4])`, `host (1.2.3.4)` and `[1.2.3.4]`.
 */
function splitHostAndIpAddress(clauseValue: string): {
  host: string;
  ipAddress?: string;
} {
  const indexOfOpeningRoundBracket = clauseValue.indexOf('(');
  const host = (
    indexOfOpeningRoundBracket === -1
      ? clauseValue
      : clauseValue.slice(0, indexOfOpeningRoundBracket)
  ).trim();
  const comment =
    indexOfOpeningRoundBracket === -1 ? '' : clauseValue.slice(indexOfOpeningRoundBracket);

  // Prefer the address the receiving server has seen, it is inside the comment
  const bracketMatch = comment.match(/\[([^\]]+)\]/) ?? host.match(/\[([^\]]+)\]/);
  if (bracketMatch?.[1]) {
    return { host, ipAddress: bracketMatch[1].replace(/^IPv6:/i, '').trim() };
  }

  const commentContent = comment.match(/^\(([^)]*)\)/)?.[1]?.trim();
  if (commentContent && ipAddressRegex.test(commentContent)) {
    return { host, ipAddress: commentContent };
  }

  return { host };
}

/**
 * Finds the clauses (from, by, via, with, id, for) of a received header.
 * Keywords inside of comments `(...)` or angle brackets `<...>` are ignored.
 */
function splitReceivedClauses(text: string): Partial<Record<ReceivedClause, string>> {
  const positions: {
    clause: ReceivedClause;
    start: number;
    dataStart: number;
  }[] = [];
  let depth = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '(' || char === '<') {
      depth++;
      continue;
    }

    if (char === ')' || char === '>') {
      depth = Math.max(0, depth - 1);
      continue;
    }

    const isWordStart = i === 0 || /\s/.test(text[i - 1] ?? '');
    if (depth !== 0 || !isWordStart) {
      continue;
    }

    receivedClauseRegex.lastIndex = i;
    const match = receivedClauseRegex.exec(text);
    if (!match?.[1]) {
      continue;
    }

    const clause = match[1].toLowerCase() as ReceivedClause;
    if (positions.some((position) => position.clause === clause)) {
      continue;
    }

    positions.push({ clause, start: i, dataStart: i + match[0].length });
    i += match[0].length - 1;
  }

  const clauses: Partial<Record<ReceivedClause, string>> = {};
  positions.forEach((position, index) => {
    const end = positions[index + 1]?.start ?? text.length;
    clauses[position.clause] = text.slice(position.dataStart, end).trim();
  });

  return clauses;
}

function parseHeaderDate(text: string): Date | undefined {
  // Remove comments like "(UTC)", not every browser can parse them
  const date = new Date(text.replace(/\([^)]*\)/g, ' ').trim());
  return isNaN(date.getTime()) ? undefined : date;
}

function parseReceivedHeader(headerDetails: HeaderDetails): ReceivedHeaderParts {
  const result: ReceivedHeaderParts = {
    rawHeaderDetails: headerDetails,
  };

  if (!headerDetails.headerData) {
    return result;
  }

  let clauseText = headerDetails.headerData;

  // Extract Date at the end
  const indexOfSemicolon = clauseText.lastIndexOf(';');
  if (indexOfSemicolon !== -1) {
    const dateTime = parseHeaderDate(clauseText.slice(indexOfSemicolon + 1));
    if (dateTime) {
      result.dateTime = dateTime;
      clauseText = clauseText.slice(0, indexOfSemicolon);
    }
  }

  const clauses = splitReceivedClauses(clauseText);

  if (clauses.from !== undefined) {
    const fromParts = splitHostAndIpAddress(clauses.from);
    result.fromDomain = fromParts.host;
    result.fromIpAddress = fromParts.ipAddress ?? '';
  }

  if (clauses.by !== undefined) {
    const byParts = splitHostAndIpAddress(clauses.by);
    result.byDomain = byParts.host;
    result.byIpAddress = byParts.ipAddress ?? '';
  }

  if (clauses.via) {
    result.via = clauses.via;
  }
  if (clauses.with) {
    result.with = clauses.with;
  }
  if (clauses.id) {
    result.id = clauses.id;
  }
  if (clauses.for) {
    result.for = clauses.for;
  }

  return result;
}

function decodeBytes(binaryText: string, charset: string): string {
  return new TextDecoder(charset).decode(
    new Uint8Array([...binaryText].map((char) => char.charCodeAt(0))),
  );
}

function decodeBase64(encodedText: string, charset: string): string {
  return decodeBytes(atob(encodedText), charset);
}

function decodeQuotedPrintable(encodedText: string, charset: string): string {
  const binaryText = encodedText
    .replace(/_/g, ' ')
    .replace(/=([A-Fa-f0-9]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  return decodeBytes(binaryText, charset);
}

/**
 * Decodes all MIME encoded-words (RFC 2047) of a text.
 * An encoded-word that cannot be decoded (unknown charset, invalid data) is kept unchanged.
 */
function decodeMimeWords(text: string): string {
  return (
    text
      // Whitespace between two encoded-words is not part of the text
      .replace(/(=\?[^?\s]+\?[BQ]\?[^?\s]*\?=)\s+(?==\?[^?\s]+\?[BQ]\?)/gi, '$1')
      .replace(
        /=\?([^?\s]+)\?([BQ])\?([^?\s]*)\?=/gi,
        (encodedWord, charset: string, encoding: string, encodedText: string) => {
          // The charset can contain a language, for example "utf-8*en"
          const charsetName = charset.split('*')[0] ?? charset;

          try {
            return encoding.toUpperCase() === 'B'
              ? decodeBase64(encodedText, charsetName)
              : decodeQuotedPrintable(encodedText, charsetName);
          } catch {
            return encodedWord;
          }
        },
      )
  );
}

function decodeMailHeader(mailHeader: string, headerIndex: number): HeaderDetails {
  const indexOfFirstColon = mailHeader.indexOf(':');

  const headerName = mailHeader.slice(0, indexOfFirstColon).trim();
  const headerData = decodeMimeWords(mailHeader.slice(indexOfFirstColon + 1).trim());

  return {
    headerName,
    headerData,
    headerIndex,
  };
}

function splitMailHeader(mailRaw: string): HeaderDetails[] {
  // Empty lines at the beginning are a copy and paste leftover
  const lines = mailRaw.replace(/^(?:[ \t]*\r?\n)+/, '').split(/\r?\n/);

  const formattedHeader: HeaderDetails[] = [];
  let currentLine = '';

  const pushCurrentLine = () => {
    if (currentLine) {
      formattedHeader.push(decodeMailHeader(currentLine, formattedHeader.length));
    }
    currentLine = '';
  };

  for (const line of lines) {
    if (!line) {
      // An empty line marks the end of the header
      break;
    }

    if (/^\s/.test(line)) {
      // Line is a continuation of the previous header field
      if (currentLine) {
        currentLine += ' ' + line.trim();
      }
      continue;
    }

    if (headerLineRegex.test(line)) {
      // Line is a new header field
      pushCurrentLine();
      currentLine = line;
      continue;
    }

    // Line is no header field, for example "Microsoft Mail Internet Headers Version 2.0"
    // or a continuation line that lost the indentation
    if (currentLine) {
      currentLine += ' ' + line.trim();
    }
  }

  // Push the last accumulated line
  pushCurrentLine();

  return formattedHeader;
}

/**
 * Returns all headers with the given name, header names are case-insensitive (RFC 5322).
 */
function filterHeaders(headers: HeaderDetails[] | undefined, headerName: string): HeaderDetails[] {
  const lowerCaseHeaderName = headerName.toLowerCase();
  return (headers ?? []).filter(
    (header) => header.headerName.toLowerCase() === lowerCaseHeaderName,
  );
}

export interface MailAddress {
  /** The display name, for example "Example Billing" */
  name?: string;
  /** The mail address, for example "billing@example.com" */
  address: string;
  /** The domain of the mail address in lower case, for example "example.com" */
  domain?: string;
}

/**
 * Splits a list of addresses like `"Doe, Jane" <jane@example.org>, john@example.org`.
 */
function parseMailAddresses(headerData: string | undefined): MailAddress[] {
  if (!headerData?.trim()) {
    return [];
  }

  // Split at commas, but not inside of quotes or angle brackets
  const parts = headerData.match(/(?:"[^"]*"|<[^>]*>|[^,])+/g) ?? [];

  return parts
    .map((part) => part.trim())
    .filter((part) => part)
    .map((part) => {
      const match = part.match(/^(.*)<([^>]*)>\s*$/);
      const address = (match?.[2] ?? part).trim();
      const name = match?.[1]
        ?.trim()
        .replace(/^"(.*)"$/, '$1')
        .trim();

      const mailAddress: MailAddress = { address };
      if (name) {
        mailAddress.name = name;
      }

      const indexOfAt = address.lastIndexOf('@');
      if (indexOfAt !== -1 && indexOfAt < address.length - 1) {
        mailAddress.domain = address.slice(indexOfAt + 1).toLowerCase();
      }

      return mailAddress;
    });
}

/**
 * Checks if two domains belong together, for example "bounces.example.com" and "example.com".
 */
function isSameOrSubdomain(domainA: string | undefined, domainB: string | undefined): boolean {
  if (!domainA || !domainB) {
    return false;
  }

  const a = domainA.toLowerCase();
  const b = domainB.toLowerCase();

  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
}

export const mailHelper = {
  parseMailAddresses,
  isSameOrSubdomain,
  splitMailHeader,
  parseReceivedHeader,
  filterHeaders,
};
