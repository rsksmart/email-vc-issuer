import express from 'express'
import request from 'supertest'
import { setupApi } from '../src/api'
import { IVCIssuer } from '../src/issuer'
import { SendVerificationCode } from '../src/senders/sender'
import { did, type, subject, code, jwt, logger } from './utils'

class VCIssuerMock implements IVCIssuer {
  public requestVerificatonFails = false
  public verifyFails = false

  credentialType = type
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  requestVerification = (did: string, request: string) => this.requestVerificatonFails ? Promise.reject() : Promise.resolve(code)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  verify = (did: string, sig: string): Promise<string> => this.verifyFails ? Promise.reject() : Promise.resolve(jwt)
}

const prefix = '/test'
const requestVerificationUrl = `${prefix}/requestVerification/${did}`
const verifyUrl = `${prefix}/verify/${did}`

describe('api', function (this: {
  app: ReturnType<typeof express>
  vcIssuer: VCIssuerMock
  sendVerificationCode: jest.MockedFunction<SendVerificationCode>
}) {
  beforeEach(async () => {
    this.app = express()
    this.vcIssuer = new VCIssuerMock()
    setupApi(this.app, prefix, this.vcIssuer, logger)
  })

  describe('request verification', () => {
    test('request with no subject responses 500', () => request(this.app)
      .post(requestVerificationUrl)
      .send({})
      .then(({ status }) => expect(status).toEqual(500))
    )

    test('request with empty subject responses 500', () => request(this.app)
      .post(requestVerificationUrl)
      .send({ subject: '' })
      .then(({ status }) => expect(status).toEqual(500))
    )

    test('fails creating verification code responses 500', async () => {
      this.vcIssuer.requestVerificatonFails = true
      const response = await request(this.app).post(requestVerificationUrl).send({ subject })
      expect(response.status).toEqual(500)
    })
  })

  describe('verify', () => {
    test('verifies code', async () => {
      const response = await request(this.app).post(verifyUrl).send({ did, sig: 'sig' })
      expect(response.status).toEqual(200)
      expect(response.body.jwt).toEqual(jwt)
    })

    test('fails verifying responses 500', async () => {
      this.vcIssuer.verifyFails = true
      const response = await request(this.app).post(verifyUrl).send({ did, sig: 'sig' })
      expect(response.status).toEqual(500)
    })
  })
})
