import Ajv from 'ajv'
//import smsCredentialSchema from '@rsksmart/vc-json-schemas/schema/SmsCredentialSchema/v1.0/schema.json'
import { verifyCredential } from 'did-jwt-vc'
import SmsVCIssuer from '../../src/model/SmsVCIssuer'
import { issuer, resolver, did, phoneNumber } from '../mocks'
import MockDate from 'mockdate'
import { Connection, Repository } from 'typeorm'
import { createSqliteConnection, deleteDatabase, resetDatabase } from '../utils'
import IssuedSmsVC from '../../src/model/entities/issued-vc-sms'

const ajv = new Ajv()
//const validateSmsSchema = ajv.compile(smsCredentialSchema.schema)

describe('SmsVCIssuer', function (this: {
  dbConnection: Connection
  smsVCIssuer: SmsVCIssuer
  repository: Repository<IssuedSmsVC>
}) {
  const database = './sms-vc-issuer.test.sqlite'

  beforeAll(async () => {
    this.dbConnection = await createSqliteConnection(database)
  })

  beforeEach(async () => {
    await resetDatabase(this.dbConnection)
    this.repository = this.dbConnection.getRepository(IssuedSmsVC)
    this.smsVCIssuer = new SmsVCIssuer(issuer, this.repository)
  })

  afterAll(() => deleteDatabase(this.dbConnection, database))

  test('should issue an SmsCredential v0.1 verifiable credential', async () => {
    const iat = Date.now()
    MockDate.set(iat)

    const jwt = await this.smsVCIssuer.createVerifiableCredentialFor(did, phoneNumber)

    const { verifiableCredential } = await verifyCredential(jwt, resolver)

    //expect(validateSmsSchema(verifiableCredential.credentialSubject)).toBeTruthy()
    expect(verifiableCredential.vc.credentialSchema.id).toEqual('did:ethr:rsk:0x8a32da624dd9fad8bf4f32d9456f374b60d9ad28;id=1eb2af6b-0dee-6090-cb55-0ed093f9b026;version=1.0')
    expect(verifiableCredential.credentialSubject.phoneNumber).toEqual(phoneNumber)
    expect(verifiableCredential.credentialSubject.id).toEqual(did)
    expect(verifiableCredential.issuer.id).toEqual(issuer.did)
    expect(verifiableCredential.issuanceDate).toEqual(new Date(Math.floor(iat / 1000) * 1000).toISOString())

    MockDate.reset()
  })

  test('should issue the same credential even if it invoked twice in a different time with the same value', async () => {
    const jwt1 = await this.smsVCIssuer.createVerifiableCredentialFor(did, phoneNumber)
    MockDate.set(Date.now() + 400000)
    const jwt2 = await this.smsVCIssuer.createVerifiableCredentialFor(did, phoneNumber)

    expect(jwt1).toEqual(jwt2)

    MockDate.reset()
  })

  test('should save the credential in the db once it is issued for the first time', async () => {
    const beforeSaving = await this.repository.findOne({ where: { did, phoneNumber } })

    expect(beforeSaving).toBeFalsy()

    const jwt = await this.smsVCIssuer.createVerifiableCredentialFor(did, phoneNumber)

    const afterSaving = await this.repository.findOne({ where: { did, phoneNumber } })
    
    expect(afterSaving!.jwt).toEqual(jwt)
  })
})
