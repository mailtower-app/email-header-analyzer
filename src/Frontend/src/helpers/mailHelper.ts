import { HeaderDetails } from 'src/models/HeaderDetails'
import { ReceivedHeaderParts } from 'src/models/ReceivedHeaderParts'

function splitMailHeaderDomainIpAddress (receiveHeader : string) : string[] {
  const indexOfOpeningRoundClamp = receiveHeader.indexOf('(')
  if (indexOfOpeningRoundClamp === -1) {
    return [receiveHeader]
  }

  const hostname = receiveHeader.slice(0, indexOfOpeningRoundClamp).trim()
  const ipAddress = receiveHeader.slice(indexOfOpeningRoundClamp + 1, receiveHeader.indexOf(')')).trim()

  return [hostname, ipAddress]
}

function parseReceivedHeader (headerDetails: HeaderDetails): ReceivedHeaderParts {
  const textPartFrom = 'from'
  const textPartBy = 'by'
  const textPartWith = 'with'
  const textPartId = 'id'
  const textPartVia = 'via'

  const result : ReceivedHeaderParts = {
    rawHeaderDetails: headerDetails
  }

  if (!headerDetails.headerData) {
    return result
  }

  let tempHeader = headerDetails.headerData

  // Extract Date at the end

  const indexOfSemilicon = headerDetails.headerData.lastIndexOf(';')
  if (indexOfSemilicon !== -1) {
    const tempDate = headerDetails.headerData.slice(indexOfSemilicon + 1).trim()
    result.dateTime = new Date(tempDate)
    tempHeader = headerDetails.headerData.slice(0, indexOfSemilicon)
  }

  // Section - from

  const startIndexFrom = tempHeader.indexOf(`${textPartFrom} `)

  let dataStartIndexFrom = 0
  if (startIndexFrom >= 0) {
    dataStartIndexFrom = startIndexFrom + textPartFrom.length + 1
  }

  // Section - by

  const startIndexBy = tempHeader.indexOf(`${textPartBy} `, dataStartIndexFrom)
  if (startIndexBy === -1) {
    return result
  }

  if (startIndexFrom !== -1) {
    const tempFrom = tempHeader.slice(dataStartIndexFrom, startIndexBy - 1)
    const fromParts = splitMailHeaderDomainIpAddress(tempFrom)

    result.fromDomain = fromParts[0]
    result.fromIpAddress = fromParts[1]
  }

  const dataStartIndexBy = startIndexBy + textPartBy.length + 1

  // Section - with

  const startIndexWith = tempHeader.indexOf(`${textPartWith} `, dataStartIndexBy)
  if (startIndexWith === -1) {
    return result
  }

  const tempBy = tempHeader.slice(dataStartIndexBy, startIndexWith - 1)
  const byParts = splitMailHeaderDomainIpAddress(tempBy)

  result.byDomain = byParts[0]
  result.byIpAddress = byParts[1]

  const dataStartIndexWith = startIndexWith + textPartWith.length + 1
  let dataEndIndexWith = tempHeader.length

  // Prepare for optional

  let startIndexNextSearch = dataStartIndexWith

  // Section - id

  const startIndexId = tempHeader.indexOf(`${textPartId} `, startIndexNextSearch)
  let dataStartIndexId = 0
  let dataEndIndexId = 0
  if (startIndexId !== -1) {
    dataStartIndexId = startIndexId + textPartId.length + 1
    startIndexNextSearch = dataStartIndexId

    dataEndIndexWith = startIndexId - 1
  }

  // Section - via

  const startIndexVia = tempHeader.indexOf(`${textPartVia} `, startIndexNextSearch)
  let dataStartIndexVia = 0
  let dataEndIndexVia = 0
  if (startIndexVia !== -1) {
    dataStartIndexVia = startIndexVia + textPartVia.length + 1

    startIndexNextSearch = dataStartIndexVia

    dataEndIndexId = startIndexVia - 1

    dataEndIndexVia = tempHeader.length
  } else {
    dataEndIndexId = tempHeader.length
  }

  // Extract data

  if (dataStartIndexWith > 0) {
    result.with = tempHeader.slice(dataStartIndexWith, dataEndIndexWith)
  }
  if (dataStartIndexId > 0) {
    result.id = tempHeader.slice(dataStartIndexId, dataEndIndexId)
  }
  if (dataStartIndexVia > 0) {
    result.via = tempHeader.slice(dataStartIndexVia, dataEndIndexVia)
  }

  return result
}

function decodeBase64 (encodedText: string, charset: string): string {
  const decodedText = atob(encodedText)
  return new TextDecoder(charset).decode(new Uint8Array([...decodedText].map(char => char.charCodeAt(0))))
}

function decodeQuotedPrintable (encodedText: string, charset: string): string {
  const decodedText = encodedText.replace(/=([A-Fa-f0-9]{2})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16))
  })

  return new TextDecoder(charset).decode(new Uint8Array([...decodedText].map(char => char.charCodeAt(0))))
}

function decodeMailHeader (mailHeader: string, headerIndex: number): HeaderDetails {
  const encodedMailHeader = mailHeader.replace(/\s=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi, (_, charset, encoding, encodedText) => {
    if (encoding.toUpperCase() === 'B') {
      return decodeBase64(encodedText, charset)
    } else if (encoding.toUpperCase() === 'Q') {
      return decodeQuotedPrintable(encodedText, charset).trim()
    }
    return mailHeader
  })

  const indexOfFirstColon = encodedMailHeader.indexOf(':')

  return {
    headerName: encodedMailHeader.slice(0, indexOfFirstColon),
    headerData: encodedMailHeader.slice(indexOfFirstColon + 2),
    headerIndex
  }
}

function splitMailHeader (mailRaw : string) : HeaderDetails[] | undefined {
  const lines = mailRaw.split(/\r?\n/)
  if (!lines) {
    return undefined
  }

  const formattedHeader = []
  let currentLine = ''
  let headerIndex = 0

  for (const line of lines) {
    if (!line) {
      break
    }

    if (/^\s/.test(line)) {
      // Line is a continuation of the previous header field
      currentLine += line
    } else {
      // Line is a new header field
      if (currentLine) {
        formattedHeader.push(decodeMailHeader(currentLine, headerIndex))
        headerIndex++
      }

      currentLine = line
    }
  }

  // Push the last accumulated line
  if (currentLine) {
    formattedHeader.push(decodeMailHeader(currentLine, headerIndex))
  }

  // Join the formatted header lines with new lines
  return formattedHeader
}

export const mailHelper = {
  splitMailHeader,
  parseReceivedHeader
}
