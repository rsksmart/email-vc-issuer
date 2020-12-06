import { ecsign, hashPersonalMessage, toRpcSig } from 'ethereumjs-util'
import { verifyCredential } from 'did-jwt-vc'
import EmailVCIssuerInterface, { INVALID_SIGNATURE_ERROR_MESSAGE } from './EmailVCIssuerInterface'
import { createIssuer, createResolver } from './TestObjectFactory'

const issuer = createIssuer()
const resolver = createResolver()

const decorateVerificationCode = (code: string) => `Verification code: ${code}`

const privateKey = Buffer.from('876d78e89797cf2cf9441e4d0d111589cd8b36a20485d4073d03193e2f3d4861', 'hex')
const did = 'did:ethr:rsk:0x87eb390df1e05ef0560e387206f5997034cd6f28'
const emailAddress = 'test@sample.com'

describe('EmailVCIssuerInterface', () => {
  test('issues verifiable credential when verification code is signed', async () => {
    const emailVCIssuerInterface = new EmailVCIssuerInterface(issuer, decorateVerificationCode)

    const verificationCode = emailVCIssuerInterface.requestVerificationFor(did, emailAddress)

    const msg = decorateVerificationCode(verificationCode)
    const msgHash = hashPersonalMessage(Buffer.from(msg))
    const { v, r, s } = ecsign(msgHash, privateKey)
    const sig = toRpcSig(v, r, s)

    const jwt = await emailVCIssuerInterface.verify(did, sig)

    const { verifiableCredential } = await verifyCredential(jwt, resolver)

    expect(verifiableCredential.credentialSubject.emailAddress).toEqual(emailAddress)
    expect(verifiableCredential.credentialSubject.id).toEqual(did)
    expect(verifiableCredential.issuer.id).toEqual(issuer.did)
  })

  test('fails on invalid signature', async () => {
    const emailVCIssuerInterface = new EmailVCIssuerInterface(issuer, decorateVerificationCode)

    // the private key does not correspond to the did
    const privateKey = Buffer.from('8586abcdf499527f33d4f4ecdd8c785066d095ce75b43e44326a0612914fb57e', 'hex')

    const verificationCode = emailVCIssuerInterface.requestVerificationFor(did, emailAddress)

    const msg = decorateVerificationCode(verificationCode)
    const msgHash = hashPersonalMessage(Buffer.from(msg))
    const { v, r, s } = ecsign(msgHash, privateKey)
    const sig = toRpcSig(v, r, s)

    expect(() => emailVCIssuerInterface.verify(did, sig)).toThrowError(INVALID_SIGNATURE_ERROR_MESSAGE)
  })

  test('fails on invalid verification code', async () => {
    const emailVCIssuerInterface = new EmailVCIssuerInterface(issuer, decorateVerificationCode)

    emailVCIssuerInterface.requestVerificationFor(did, emailAddress)

    const msg = decorateVerificationCode('INVALID VERIFICATION CODE')
    const msgHash = hashPersonalMessage(Buffer.from(msg))
    const { v, r, s } = ecsign(msgHash, privateKey)
    const sig = toRpcSig(v, r, s)

    expect(() => emailVCIssuerInterface.verify(did, sig)).toThrowError(INVALID_SIGNATURE_ERROR_MESSAGE)
  })
})
