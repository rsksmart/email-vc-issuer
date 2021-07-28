import { rskDIDFromPrivateKey, rskTestnetDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'

export const createIssuer = (privateKey: string, networkName: string) => networkName === 'rsk:testnet'
    ? rskTestnetDIDFromPrivateKey()(privateKey)
    : rskDIDFromPrivateKey()(privateKey)
