import { verifyCredential } from 'did-jwt-vc'
import EmailVCIssuerInterface, { INVALID_SIGNATURE_ERROR_MESSAGE } from '../../src/model/EmailVCIssuerInterface'
import { rpcPersonalSign } from '../utils'
import { decorateVerificationCode, privateKey, did, emailAddress, anotherPrivateKey } from '../mocks'
import { issuer, resolver } from '../mocks'

describe('EmailVCIssuerInterface', function (this: {
  emailVCIssuerInterface: EmailVCIssuerInterface
}) {
  beforeEach(() => {
    this.emailVCIssuerInterface = new EmailVCIssuerInterface(issuer, decorateVerificationCode)
  })
  test('issues verifiable credential when verification code is signed', async () => {
    const verificationCode = this.emailVCIssuerInterface.requestVerificationFor(did, emailAddress)

    const sig = rpcPersonalSign(decorateVerificationCode(verificationCode), privateKey)

    const jwt = await this.emailVCIssuerInterface.verify(did, sig)

    const { verifiableCredential } = await verifyCredential(jwt, resolver)

    expect(verifiableCredential.credentialSubject.emailAddress).toEqual(emailAddress)
    expect(verifiableCredential.credentialSubject.id).toEqual(did)
    expect(verifiableCredential.issuer.id).toEqual(issuer.did)
  })

  test('fails on invalid signature', () => {
    expect.assertions(1)

    const verificationCode = this.emailVCIssuerInterface.requestVerificationFor(did, emailAddress)

    const sig = rpcPersonalSign(decorateVerificationCode(verificationCode), anotherPrivateKey)

    return expect(() => this.emailVCIssuerInterface.verify(did, sig)).toThrowError(INVALID_SIGNATURE_ERROR_MESSAGE)
  })

  test('fails on invalid verification code', () => {
    expect.assertions(1)

    this.emailVCIssuerInterface.requestVerificationFor(did, emailAddress)

    const sig = rpcPersonalSign(decorateVerificationCode('INVALID VERIFICATION CODE'), privateKey)

    return expect(() => this.emailVCIssuerInterface.verify(did, sig)).toThrowError(INVALID_SIGNATURE_ERROR_MESSAGE)
  })
})
