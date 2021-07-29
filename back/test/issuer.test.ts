import { createIssuerDID } from '../src/did'
import { VCIssuer } from '../src/issuer'
import { did, issuerPrivateKey, subject, type, issuerDid } from './utils'
import { createEmailCredentialPayload, IssuedVC } from '../src/vc'
import { createConnection, Connection } from 'typeorm'
import fs from 'fs'
import { decorateVerificationCode, VerificationRequest } from '../src/verificationRequest'
import { rpcPersonalSign } from './personalSign'
import { Resolver } from 'did-resolver'
import { getResolver } from 'ethr-did-resolver'
import { verifyCredential } from 'did-jwt-vc'
import MockDate from 'mockdate'

const userPrivateKey = Buffer.from('876d78e89797cf2cf9441e4d0d111589cd8b36a20485d4073d03193e2f3d4861', 'hex')
const userDid = 'did:ethr:rsk:0x87eb390df1e05ef0560e387206f5997034cd6f28'

export const resolver = new Resolver(getResolver({
  networks: [
    { name: 'rsk:testnet', registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b', rpcUrl: 'https://did.rsk.co:4444' }
  ]
}))

describe('issuer', function (this: {
  database: string
  connection: Connection
  vcIssuer: VCIssuer
  issue: () => Promise<string>
}) {
  beforeEach(async () => {
    const identity = createIssuerDID(issuerPrivateKey, 'rsk:testnet')
    this.database = `issuer-test-${+Date.now()}.sqlite`
    this.connection = await createConnection({
      type: 'sqlite',
      database: this.database,
      entities: [VerificationRequest, IssuedVC],
      logging: false,
      dropSchema: true,
      synchronize: true
    })

    this.vcIssuer = new VCIssuer(identity, this.connection, type, createEmailCredentialPayload)

    this.issue = async () => {
      const code = await this.vcIssuer.requestVerification(userDid, subject)

      const sig = rpcPersonalSign(decorateVerificationCode(code), userPrivateKey)
      const jwt = await this.vcIssuer.verify(userDid, sig)

      return jwt
    }
  })

  afterEach(async () => {
    await this.connection.close()
    fs.unlinkSync(this.database)
  })

  describe('request verification', () => {
    test('creates random codes', async () => {
      const code1 = await this.vcIssuer.requestVerification(did, subject)
      const code2 = await this.vcIssuer.requestVerification(did, subject)
      expect(code1).not.toEqual(code2)
    })

    test('stores only last verification code', async () => {
      await this.vcIssuer.requestVerification(did, subject)
      const code = await this.vcIssuer.requestVerification(did, subject)
      const requests = await this.connection.getRepository(VerificationRequest).find({ where: { did, type }})
      expect(requests).toHaveLength(1)
      expect(requests[0].code).toEqual(code)
    })
  })

  describe('verify', () => {
    test('fails if no request', () => expect(() => this.vcIssuer.verify(did, 'sig')).rejects.toThrowError())

    test('fails if invalid signature', async () => {
      await this.vcIssuer.requestVerification(did, subject)
      await expect(() => this.vcIssuer.verify(did, 'sig')).rejects.toThrowError()
    })

    test('fails if invalid signer', async () => {
      const otherPrivateKey = Buffer.from('c96773b3daf3d927a502fa454aeec0f58fb4bf832ba827386cd079fc2cab1851', 'hex')
      const code = await this.vcIssuer.requestVerification(userDid, subject)
      const sig = rpcPersonalSign(decorateVerificationCode(code), otherPrivateKey)
      await expect(() => this.vcIssuer.verify(did, sig)).rejects.toThrowError()
    })

    test('fails if verification code expired', async () => {
      const code = await this.vcIssuer.requestVerification(userDid, subject)

      MockDate.set(+Date.now() + 600000 + 1) // from default value

      const sig = rpcPersonalSign(decorateVerificationCode(code), userPrivateKey)
      await expect(() => this.vcIssuer.verify(did, sig)).rejects.toThrowError()

      MockDate.reset()
    })

    test('creates and stores a vc', async () => {
      const jwt = await this.issue()

      const { verifiableCredential } = await verifyCredential(jwt, resolver)

      expect(verifiableCredential.credentialSubject.emailAddress).toEqual(subject)
      expect(verifiableCredential.credentialSubject.id).toEqual(userDid)
      expect(verifiableCredential.issuer.id.toLowerCase()).toEqual(issuerDid)
    })

    test('does not issue twice the same credential', async () => {
      const jwt1 = await this.issue()
      const jwt2 = await this.issue()

      expect(jwt1).toEqual(jwt2)
    })
  })
})
