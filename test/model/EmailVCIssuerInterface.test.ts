import { verifyCredential } from 'did-jwt-vc'
import EmailVCIssuerInterface, { INVALID_SIGNATURE_ERROR_MESSAGE } from '../../model/EmailVCIssuerInterface'
import { rpcPersonalSign } from '../utils'
import { decorateVerificationCode, privateKey, did, emailAddress, anotherPrivateKey } from '../mocks'
import { issuer, resolver } from '../mocks'

describe('EmailVCIssuerInterface', () => {
  test('issues verifiable credential when verification code is signed', async () => {
    const emailVCIssuerInterface = new EmailVCIssuerInterface(issuer, decorateVerificationCode)

    const verificationCode = emailVCIssuerInterface.requestVerificationFor(did, emailAddress)

    const sig = rpcPersonalSign(decorateVerificationCode(verificationCode), privateKey)

    const jwt = await emailVCIssuerInterface.verify(did, sig)

    const { verifiableCredential } = await verifyCredential(jwt, resolver)

    expect(verifiableCredential.credentialSubject.emailAddress).toEqual(emailAddress)
    expect(verifiableCredential.credentialSubject.id).toEqual(did)
    expect(verifiableCredential.issuer.id).toEqual(issuer.did)
  })

  test('fails on invalid signature', async () => {
    const emailVCIssuerInterface = new EmailVCIssuerInterface(issuer, decorateVerificationCode)

    const verificationCode = emailVCIssuerInterface.requestVerificationFor(did, emailAddress)

    const sig = rpcPersonalSign(decorateVerificationCode(verificationCode), anotherPrivateKey)

    expect(() => emailVCIssuerInterface.verify(did, sig)).toThrowError(INVALID_SIGNATURE_ERROR_MESSAGE)
  })

  test('fails on invalid verification code', async () => {
    const emailVCIssuerInterface = new EmailVCIssuerInterface(issuer, decorateVerificationCode)

    emailVCIssuerInterface.requestVerificationFor(did, emailAddress)

    const sig = rpcPersonalSign(decorateVerificationCode('INVALID VERIFICATION CODE'), privateKey)

    expect(() => emailVCIssuerInterface.verify(did, sig)).toThrowError(INVALID_SIGNATURE_ERROR_MESSAGE)
  })
})
