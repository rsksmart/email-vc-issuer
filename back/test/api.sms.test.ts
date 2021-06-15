import express, { Express } from 'express'
import request from 'supertest'
import { verifyCredential } from 'did-jwt-vc'
import { createSqliteConnection, deleteDatabase, resetDatabase, rpcPersonalSign } from './utils'
import { issuer, resolver, decorateVerificationCode, did, privateKey, phoneNumber, anotherPrivateKey } from './mocks'
import { setupSmsService, UNHANDLED_ERROR_MESSAGE } from '../src/api'
import SmsVCIssuerInterface, { INVALID_SIGNATURE_ERROR_MESSAGE } from '../src/model/SmsVCIssuerInterface'
import { CODE_NOT_GENERATED_ERROR_MESSAGE } from '../src/model/VerificationCodeChecker'
import { Logger } from '@rsksmart/rif-node-utils/lib/logger'
import { Connection, Repository } from 'typeorm'
import IssuedSmsVC from '../src/model/entities/issued-vc-sms'

const mockedLogger = { info: () => {}, error: () => {} } as unknown as Logger

describe('service', function (this: {
  sendSmsVerificationCode: (to: string, text: string) => Promise<void>
  lastVerificationCodeSent: string
  app: Express
  dbConnection: Connection
  repository: Repository<IssuedSmsVC>
}) {
  const database = './sms-vc-issuer-api.test.sqlite'

  this.sendSmsVerificationCode = (to: string, text: string) => {
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
    const smsVCIssuerInterface = new SmsVCIssuerInterface(issuer, this.dbConnection, decorateVerificationCode)
    setupSmsService(this.app, { smsVCIssuerInterface, sendSmsVerificationCode: this.sendSmsVerificationCode }, mockedLogger)
  })

  test('verifies an sms', async () => {
    
    await request(this.app).post(`/requestSmsVerification/${did}`).send({ phoneNumber })

    const sig = rpcPersonalSign(decorateVerificationCode(this.lastVerificationCodeSent), privateKey)

    const jwt = await request(this.app).post(`/verifySms/${did}`).send({ sig }).then((res: any) => res.body.jwt)

    const { verifiableCredential } = await verifyCredential(jwt, resolver)

    expect(verifiableCredential.credentialSubject.phoneNumber).toEqual(phoneNumber)
    expect(verifiableCredential.credentialSubject.id).toEqual(did)
    expect(verifiableCredential.issuer.id).toEqual(issuer.did)

  })

  test('500 when invalid signer', async () => {
    await request(this.app).post(`/requestSmsVerification/${did}`).send({ phoneNumber })

    const sig = rpcPersonalSign(decorateVerificationCode(this.lastVerificationCodeSent), anotherPrivateKey)

    await request(this.app).post(`/verifySms/${did}`).send({ sig }).then((res: any) => {
      expect(res.statusCode).toEqual(500)
      expect(res.text).toEqual(UNHANDLED_ERROR_MESSAGE)
    })
  })

  test('500 when invalid verification code', async () => {
    await request(this.app).post(`/requestSmsVerification/${did}`).send({ phoneNumber })

    const sig = rpcPersonalSign(decorateVerificationCode('INVALID VERIFICATION CODE'), anotherPrivateKey)

    await request(this.app).post(`/verifySms/${did}`).send({ sig }).then((res: any) => {
      expect(res.statusCode).toEqual(500)
      expect(res.text).toEqual(UNHANDLED_ERROR_MESSAGE)
    })
  })

  test('500 when no verification code requested', async () => {
    const sig = rpcPersonalSign(decorateVerificationCode('A VERIFICATION CODE'), anotherPrivateKey)

    await request(this.app).post(`/verifySms/${did}`).send({ sig }).then((res: any) => {
      expect(res.statusCode).toEqual(500)
      expect(res.text).toEqual(UNHANDLED_ERROR_MESSAGE)
    })
  })
})
