import express from 'express'
import request from 'supertest'
import { loggerFactory } from '@rsksmart/rif-node-utils/lib/logger'
import { setupApi, SendVerificationCode } from '../src/api'
import { IVCIssuer } from '../src/issuer'
import { did, type, subject, code, jwt } from './utils'

class VCIssuerMock implements IVCIssuer {
  public requestVerificatonFails = false
  public verifyFails = false

  credentialType = type
  requestVerification = (did: string, request: string) => this.requestVerificatonFails ? Promise.reject() : Promise.resolve(code)
  verify = (did: string, sig: string): Promise<string> => this.verifyFails ? Promise.reject() : Promise.resolve(jwt)
}

const prefix = '/test'
const requestVerificationUrl = `${prefix}/requestVerification/${did}`
const verifyUrl = `${prefix}/verify/${did}`

const getError = async (value: Promise<any>) => {
  try {
    await value
  } catch(e) {
    return e
  }
  throw new Error('Didn\'t fail')
}

describe('api', function (this: {
  app: ReturnType<typeof express>
  vcIssuer: VCIssuerMock
  sendVerificationCode: jest.MockedFunction<SendVerificationCode>
}) {
  beforeEach(async () => {
    this.app = express()
    this.vcIssuer = new VCIssuerMock()
    this.sendVerificationCode = jest.fn()
    const logger = loggerFactory({ env: 'test', infoFile: './log/api-test-info.log', errorFile: './api-test-error.log' })('test')
    setupApi(this.app, prefix, this.vcIssuer, this.sendVerificationCode, logger)
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

    test('sends verificatoin code', async () => {
      const response = await request(this.app).post(requestVerificationUrl).send({ subject })
      expect(response.status).toEqual(200)
      expect(this.sendVerificationCode.mock.calls).toHaveLength(1)
      expect(this.sendVerificationCode.mock.calls[0]).toEqual([subject, code])
      expect(this.sendVerificationCode.mock.results).toHaveLength(1)
      expect(this.sendVerificationCode.mock.results[0]).toEqual({ type: 'return' })
    })

    test('fails creating verification code responses 500', async () => {
      this.vcIssuer.requestVerificatonFails = true
      const response = await request(this.app).post(requestVerificationUrl).send({ subject })
      expect(response.status).toEqual(500)
    })

    test('fails sending verification code responses 500', async () => {
      const rejectValue = 'Testing Error'
      this.sendVerificationCode.mockRejectedValue(rejectValue)
      const response = await request(this.app).post(requestVerificationUrl).send({ subject })
      expect(response.status).toEqual(500)
      expect(this.sendVerificationCode.mock.results).toHaveLength(1)
      expect(this.sendVerificationCode.mock.results[0].type).toEqual('return')
      expect(await getError(this.sendVerificationCode.mock.results[0].value)).toEqual(rejectValue)
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
