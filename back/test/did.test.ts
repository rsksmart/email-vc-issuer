import { account, did, issuerPrivateKey } from './utils'
import { createIssuerDID, getAccountFromDID } from '../src/did'

describe('did', () => {
  test('create did for rsk', () => expect(createIssuerDID(issuerPrivateKey, 'rsk').did).toContain('did:ethr:rsk'))
  test('create did for rsk testnet', () => expect(createIssuerDID(issuerPrivateKey, 'rsk:testnet').did).toContain('did:ethr:rsk:testnet'))
  test('get account', () => expect(getAccountFromDID(did)).toEqual(account))
})
