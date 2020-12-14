import Ajv from 'ajv'
import emailCredentialSchema from '@rsksmart/vc-json-schemas/schema/EmailCredentialSchema/v1.0/schema.json'
import { verifyCredential } from 'did-jwt-vc'
import EmailVCIssuer from '../../src/model/EmailVCIssuer'
import { issuer, resolver, did, emailAddress } from '../mocks'
import MockDate from 'mockdate'
import { Connection, Repository } from 'typeorm'
import { createSqliteConnection, deleteDatabase, resetDatabase } from '../utils'
import IssuedEmailVC from '../../src/model/entities/issued-vc'

const ajv = new Ajv()
const validateEmailSchema = ajv.compile(emailCredentialSchema.schema)

describe('EmailVCIssuer', function (this: {
  dbConnection: Connection
  emailVCIssuer: EmailVCIssuer
  repository: Repository<IssuedEmailVC>
}) {
  const database = './email-vc-issuer.test.sqlite'

  beforeAll(async () => {
    this.dbConnection = await createSqliteConnection(database)
  })

  beforeEach(async () => {
    await resetDatabase(this.dbConnection)
    this.repository = this.dbConnection.getRepository(IssuedEmailVC)
    this.emailVCIssuer = new EmailVCIssuer(issuer, this.repository)
  })

  afterAll(() => deleteDatabase(this.dbConnection, database))

  test('should issue an EmailCredential v0.1 verifiable credential', async () => {
    const iat = Date.now()
    MockDate.set(iat)

    const jwt = await this.emailVCIssuer.createVerifiableCredentialFor(did, emailAddress)

    const { verifiableCredential } = await verifyCredential(jwt, resolver)

    expect(validateEmailSchema(verifiableCredential.credentialSubject)).toBeTruthy()
    expect(verifiableCredential.vc.credentialSchema.id).toEqual('did:ethr:rsk:0x8a32da624dd9fad8bf4f32d9456f374b60d9ad28;id=1eb2af6b-0dee-6090-cb55-0ed093f9b026;version=1.0')
    expect(verifiableCredential.credentialSubject.emailAddress).toEqual(emailAddress)
    expect(verifiableCredential.credentialSubject.id).toEqual(did)
    expect(verifiableCredential.issuer.id).toEqual(issuer.did)
    expect(verifiableCredential.issuanceDate).toEqual(new Date(Math.floor(iat / 1000) * 1000).toISOString())

    MockDate.reset()
  })

  test('should issue the same credential even if it invoked twice in a different time with the same value', async () => {
    const jwt1 = await this.emailVCIssuer.createVerifiableCredentialFor(did, emailAddress)
    MockDate.set(Date.now() + 400000)
    const jwt2 = await this.emailVCIssuer.createVerifiableCredentialFor(did, emailAddress)

    expect(jwt1).toEqual(jwt2)

    MockDate.reset()
  })

  test('should save the credential in the db once it is issued for the first time', async () => {
    const beforeSaving = await this.repository.findOne({ where: { did, emailAddress } })

    expect(beforeSaving).toBeFalsy()

    const jwt = await this.emailVCIssuer.createVerifiableCredentialFor(did, emailAddress)

    const afterSaving = await this.repository.findOne({ where: { did, emailAddress } })
    
    expect(afterSaving!.jwt).toEqual(jwt)
  })
})
