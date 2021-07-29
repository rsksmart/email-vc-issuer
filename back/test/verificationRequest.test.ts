import { VerificationRequest, decorateVerificationCode } from '../src/verificationRequest'
import { did, type, subject, code } from './utils'
import MockDate from 'mockdate'

const size = 32
const expirationTime = 60000

describe('verification request', () => {
  test('metadata', () => {
    const verificationRequest = new VerificationRequest(did, type, subject)
    expect(verificationRequest.did).toEqual(did)
    expect(verificationRequest.type).toEqual(type)
    expect(verificationRequest.subject).toEqual(subject)
  })

  test('expiration time', () => {
    const verificationRequest = new VerificationRequest(did, type, subject, size, expirationTime)
    expect(+verificationRequest.expirationTime).toBeLessThanOrEqual(+new Date(+Date.now() + expirationTime))
    expect(verificationRequest.hasExpired()).toBeFalsy()
  })

  test('random verification code', () => {
    const verificationRequest = new VerificationRequest(did, type, subject)
    const verificationRequest2 = new VerificationRequest(did, type, subject)
    expect(verificationRequest.code).not.toEqual(verificationRequest2.code)
  })

  test('expires', () => {
    const verificationRequest = new VerificationRequest(did, type, subject, size, expirationTime)
    MockDate.set(+Date.now() + expirationTime + 1)
    expect(verificationRequest.hasExpired()).toBeTruthy()
    MockDate.reset()
  })

  test('decorate', () => expect(decorateVerificationCode(code)).toEqual('Verification code: CODE'))
})
