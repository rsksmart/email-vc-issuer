import { rskDIDFromPrivateKey, rskTestnetDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'

export const createIssuerIdentity: any = (privateKey: string, networkName: string) => networkName === 'rsk:testnet'
  ? rskTestnetDIDFromPrivateKey()(privateKey)
  : rskDIDFromPrivateKey()(privateKey)

export const getAccountFromDID = (did: string): string => did.split(':').slice(-1)[0].toLowerCase()
