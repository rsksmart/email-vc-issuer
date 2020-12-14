import { verifyCredential } from 'did-jwt-vc'
import EmailVCIssuerInterface, { INVALID_SIGNATURE_ERROR_MESSAGE } from '../../src/model/EmailVCIssuerInterface'
import { createSqliteConnection, deleteDatabase, resetDatabase, rpcPersonalSign } from '../utils'
import { decorateVerificationCode, privateKey, did, emailAddress, anotherPrivateKey } from '../mocks'
import { issuer, resolver } from '../mocks'
import { Connection, Repository } from 'typeorm'
import IssuedEmailVC from '../../src/model/entities/issued-vc'

describe('EmailVCIssuerInterface', function (this: {
  emailVCIssuerInterface: EmailVCIssuerInterface
  dbConnection: Connection
  repository: Repository<IssuedEmailVC>
}) {
  const database = './email-vc-issuer-interface.test.sqlite'

  beforeAll(async () => {
    this.dbConnection = await createSqliteConnection(database)
  })

  beforeEach(async () => {
    await resetDatabase(this.dbConnection)
    this.emailVCIssuerInterface = new EmailVCIssuerInterface(issuer, this.dbConnection, decorateVerificationCode)
  })

  afterAll(() => deleteDatabase(this.dbConnection, database))

  test('issues verifiable credential when verification code is signed', async () => {
    const verificationCode = await this.emailVCIssuerInterface.requestVerificationFor(did, emailAddress)

    const sig = rpcPersonalSign(decorateVerificationCode(verificationCode), privateKey)

    const jwt = await this.emailVCIssuerInterface.verify(did, sig)

    const { verifiableCredential } = await verifyCredential(jwt, resolver)

    expect(verifiableCredential.credentialSubject.emailAddress).toEqual(emailAddress)
    expect(verifiableCredential.credentialSubject.id).toEqual(did)
    expect(verifiableCredential.issuer.id).toEqual(issuer.did)
  })

  test('fails on invalid signature', async () => {
    expect.assertions(1)

    const verificationCode = await this.emailVCIssuerInterface.requestVerificationFor(did, emailAddress)

    const sig = rpcPersonalSign(decorateVerificationCode(verificationCode), anotherPrivateKey)

    return expect(() => this.emailVCIssuerInterface.verify(did, sig)).rejects.toThrowError(INVALID_SIGNATURE_ERROR_MESSAGE)
  })

  test('fails on invalid verification code', async () => {
    expect.assertions(1)

    await this.emailVCIssuerInterface.requestVerificationFor(did, emailAddress)

    const sig = rpcPersonalSign(decorateVerificationCode('INVALID VERIFICATION CODE'), privateKey)

    return expect(() => this.emailVCIssuerInterface.verify(did, sig)).rejects.toThrowError(INVALID_SIGNATURE_ERROR_MESSAGE)
  })
})
