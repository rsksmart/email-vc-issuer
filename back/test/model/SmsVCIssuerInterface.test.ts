import { verifyCredential } from 'did-jwt-vc'
import SmsVCIssuerInterface, { INVALID_SIGNATURE_ERROR_MESSAGE } from '../../src/model/SmsVCIssuerInterface'
import { createSqliteConnection, deleteDatabase, resetDatabase, rpcPersonalSign } from '../utils'
import { decorateVerificationCode, privateKey, did, phoneNumber, anotherPrivateKey } from '../mocks'
import { issuer, resolver } from '../mocks'
import { Connection, Repository } from 'typeorm'
import IssuedSmsVC from '../../src/model/entities/issued-vc'

describe('SmsVCIssuerInterface', function (this: {
  smsVCIssuerInterface: SmsVCIssuerInterface
  dbConnection: Connection
  repository: Repository<IssuedSmsVC>
}) {
  const database = './sms-vc-issuer-interface.test.sqlite'

  beforeAll(async () => {
    this.dbConnection = await createSqliteConnection(database)
  })

  beforeEach(async () => {
    await resetDatabase(this.dbConnection)
    this.smsVCIssuerInterface = new SmsVCIssuerInterface(issuer, this.dbConnection, decorateVerificationCode)
  })

  afterAll(() => deleteDatabase(this.dbConnection, database))

  test('issues verifiable credential when verification code is signed', async () => {
    const verificationCode = await this.smsVCIssuerInterface.requestVerificationFor(did, phoneNumber)

    const sig = rpcPersonalSign(decorateVerificationCode(verificationCode), privateKey)

    const jwt = await this.smsVCIssuerInterface.verify(did, sig)

    const { verifiableCredential } = await verifyCredential(jwt, resolver)

    expect(verifiableCredential.credentialSubject.phoneNumber).toEqual(phoneNumber)
    expect(verifiableCredential.credentialSubject.id).toEqual(did)
    expect(verifiableCredential.issuer.id).toEqual(issuer.did)
  })

  test('fails on invalid signature', async () => {
    expect.assertions(1)

    const verificationCode = await this.smsVCIssuerInterface.requestVerificationFor(did, phoneNumber)

    const sig = rpcPersonalSign(decorateVerificationCode(verificationCode), anotherPrivateKey)

    return expect(() => this.smsVCIssuerInterface.verify(did, sig)).rejects.toThrowError(INVALID_SIGNATURE_ERROR_MESSAGE)
  })

  test('fails on invalid verification code', async () => {
    expect.assertions(1)

    await this.smsVCIssuerInterface.requestVerificationFor(did, phoneNumber)

    const sig = rpcPersonalSign(decorateVerificationCode('INVALID VERIFICATION CODE'), privateKey)

    return expect(() => this.smsVCIssuerInterface.verify(did, sig)).rejects.toThrowError(INVALID_SIGNATURE_ERROR_MESSAGE)
  })
})
