import express, { Express } from 'express'
import request from 'supertest'
import { verifyCredential } from 'did-jwt-vc'
import { createSqliteConnection, deleteDatabase, resetDatabase, rpcPersonalSign } from './utils'
import { issuer, resolver, decorateVerificationCode, did, privateKey, emailAddress, anotherPrivateKey } from './mocks'
import { setupService } from '../src/api'
import EmailVCIssuerInterface, { INVALID_SIGNATURE_ERROR_MESSAGE } from '../src/model/EmailVCIssuerInterface'
import { CODE_NOT_GENERATED_ERROR_MESSAGE } from '../src/model/VerificationCodeChecker'
import { Logger } from '@rsksmart/rif-node-utils/lib/logger'
import { Connection, Repository } from 'typeorm'
import IssuedEmailVC from '../src/model/entities/issued-vc'

const mockedLogger = { info: () => {}, error: () => {} } as unknown as Logger

describe('service', function (this: {
  sendVerificationCode: (to: string, text: string) => Promise<void>
  lastVerificationCodeSent: string
  app: Express
  dbConnection: Connection
  repository: Repository<IssuedEmailVC>
}) {
  const database = './email-vc-issuer-api.test.sqlite'

  this.sendVerificationCode = (to: string, text: string) => {
    this.lastVerificationCodeSent = text
    return Promise.resolve()
  }

  beforeAll(async () => {
    this.dbConnection = await createSqliteConnection(database)
  })

  afterAll(() => deleteDatabase(this.dbConnection, database))

  beforeEach(async () => {
    await resetDatabase(this.dbConnection)
    this.app = express()
    const emailVCIssuerInterface = new EmailVCIssuerInterface(issuer, this.dbConnection, decorateVerificationCode)
    setupService(this.app, { emailVCIssuerInterface, sendVerificationCode: this.sendVerificationCode }, mockedLogger)
  })

  test('verifies an email', async () => {
    await request(this.app).post(`/requestVerification/${did}`).send({ emailAddress })

    const sig = rpcPersonalSign(decorateVerificationCode(this.lastVerificationCodeSent), privateKey)

    const jwt = await request(this.app).post(`/verify/${did}`).send({ sig }).then((res: any) => res.body.jwt)

    const { verifiableCredential } = await verifyCredential(jwt, resolver)

    expect(verifiableCredential.credentialSubject.emailAddress).toEqual(emailAddress)
    expect(verifiableCredential.credentialSubject.id).toEqual(did)
    expect(verifiableCredential.issuer.id).toEqual(issuer.did)

  })

  test('500 when invalid signer', async () => {
    await request(this.app).post(`/requestVerification/${did}`).send({ emailAddress })

    const sig = rpcPersonalSign(decorateVerificationCode(this.lastVerificationCodeSent), anotherPrivateKey)

    await request(this.app).post(`/verify/${did}`).send({ sig }).then((res: any) => {
      expect(res.statusCode).toEqual(500)
      expect(res.text).toEqual(escape(INVALID_SIGNATURE_ERROR_MESSAGE))
    })
  })

  test('500 when invalid verification code', async () => {
    await request(this.app).post(`/requestVerification/${did}`).send({ emailAddress })

    const sig = rpcPersonalSign(decorateVerificationCode('INVALID VERIFICATION CODE'), anotherPrivateKey)

    await request(this.app).post(`/verify/${did}`).send({ sig }).then((res: any) => {
      expect(res.statusCode).toEqual(500)
      expect(res.text).toEqual(escape(INVALID_SIGNATURE_ERROR_MESSAGE))
    })
  })

  test('500 when no verification code requested', async () => {
    const sig = rpcPersonalSign(decorateVerificationCode('A VERIFICATION CODE'), anotherPrivateKey)

    await request(this.app).post(`/verify/${did}`).send({ sig }).then((res: any) => {
      expect(res.statusCode).toEqual(500)
      expect(res.text).toEqual(escape(CODE_NOT_GENERATED_ERROR_MESSAGE))
    })
  })
})
