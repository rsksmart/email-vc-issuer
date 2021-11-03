import { createIssuerIdentity, getAccountFromDID } from '../src/did'
import { account, did, issuerPrivateKey } from './utils'

describe('did', () => {
  test('create did for rsk', () => expect(createIssuerIdentity(issuerPrivateKey, 'rsk').did).toContain('did:ethr:rsk'))
  test('create did for rsk testnet', () => expect(createIssuerIdentity(issuerPrivateKey, 'rsk:testnet').did).toContain('did:ethr:rsk:testnet'))
  test('get account', () => expect(getAccountFromDID(did)).toEqual(account))
})
