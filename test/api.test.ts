import express from 'express'
import request from 'supertest'
import { verifyCredential } from 'did-jwt-vc'
import { rpcPersonalSign } from './utils'
import { issuer, resolver, decorateVerificationCode, did, privateKey, emailAddress, anotherPrivateKey } from './mocks'
import { setupService } from '../src/api'
import { INVALID_SIGNATURE_ERROR_MESSAGE } from '../src/model/EmailVCIssuerInterface'
import { CODE_NOT_GENERATED_ERROR_MESSAGE } from '../src/model/VerificationCodeChecker'

describe('service', function (this: {
  sendVerificationCode: (to: string, text: string) => Promise<void>
  lastVerificationCodeSent: string
}) {
  this.sendVerificationCode = (to: string, text: string) => {
    this.lastVerificationCodeSent = text
    return Promise.resolve()
  }

  test('verifies an email', async () => {
    const app = express()
    setupService(app, { issuer, decorateVerificationCode, sendVerificationCode: this.sendVerificationCode })

    await request(app).post(`/requestVerification/${did}`).send({ emailAddress })

    const sig = rpcPersonalSign(decorateVerificationCode(this.lastVerificationCodeSent), privateKey)

    const jwt = await request(app).post(`/verify/${did}`).send({ sig }).then((res: any) => res.body.jwt)

    const { verifiableCredential } = await verifyCredential(jwt, resolver)

    expect(verifiableCredential.credentialSubject.emailAddress).toEqual(emailAddress)
    expect(verifiableCredential.credentialSubject.id).toEqual(did)
    expect(verifiableCredential.issuer.id).toEqual(issuer.did)

  })

  test('500 when invalid signer', async () => {
    const app = express()
    setupService(app, { issuer, decorateVerificationCode, sendVerificationCode: this.sendVerificationCode })

    await request(app).post(`/requestVerification/${did}`).send({ emailAddress })

    const sig = rpcPersonalSign(decorateVerificationCode(this.lastVerificationCodeSent), anotherPrivateKey)

    await request(app).post(`/verify/${did}`).send({ sig }).then((res: any) => {
      expect(res.statusCode).toEqual(500)
      expect(res.text).toEqual(INVALID_SIGNATURE_ERROR_MESSAGE)
    })
  })

  test('500 when invalid verification code', async () => {
    const app = express()
    setupService(app, { issuer, decorateVerificationCode, sendVerificationCode: this.sendVerificationCode })

    await request(app).post(`/requestVerification/${did}`).send({ emailAddress })

    const sig = rpcPersonalSign(decorateVerificationCode('INVALID VERIFICATION CODE'), anotherPrivateKey)

    await request(app).post(`/verify/${did}`).send({ sig }).then((res: any) => {
      expect(res.statusCode).toEqual(500)
      expect(res.text).toEqual(INVALID_SIGNATURE_ERROR_MESSAGE)
    })
  })

  test('500 when no verification code requested', async () => {
    const app = express()
    setupService(app, { issuer, decorateVerificationCode, sendVerificationCode: this.sendVerificationCode })

    const sig = rpcPersonalSign(decorateVerificationCode('A VERIFICATION CODE'), anotherPrivateKey)

    await request(app).post(`/verify/${did}`).send({ sig }).then((res: any) => {
      expect(res.statusCode).toEqual(500)
      expect(res.text).toEqual(CODE_NOT_GENERATED_ERROR_MESSAGE)
    })
  })
})
