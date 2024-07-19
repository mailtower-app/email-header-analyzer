import { HeaderDetails } from './HeaderDetails'

export type ReceivedHeaderParts = {
  rawHeaderDetails: HeaderDetails
  fromDomain?: string
  fromIpAddress?: string
  byDomain?: string
  byIpAddress?: string
  via?: string
  with?: string
  id?: string
  for?: string
  dateTime?: Date
}
