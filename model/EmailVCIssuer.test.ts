import EmailVCIssuer from './EmailVCIssuer'
import Ajv from 'ajv'
import emailCredentialSchema from '@rsksmart/vc-json-schemas/schema/EmailCredentialSchema/v1.0/schema.json'
import { verifyCredential } from 'did-jwt-vc'
import { createIssuer, createResolver } from './TestObjectFactory'

const issuer = createIssuer()
const resolver = createResolver()

const ajv = new Ajv()
const validateEmailSchema = ajv.compile(emailCredentialSchema.schema)

describe('EmailVCIssuer', () => {
  test('should issue an EmailCredential v0.1 verifiable credential', async () => {
    const emailVCIssuer = new EmailVCIssuer(issuer)

    const did = 'did:ethr:rsk:0x87eb390df1e05ef0560e387206f5997034cd6f28'
    const emailAddress = 'email@test.com'
    const jwt = await emailVCIssuer.createVerifiableCredentialFor(did, emailAddress)

    const { verifiableCredential } = await verifyCredential(jwt, resolver)

    expect(validateEmailSchema(verifiableCredential.credentialSubject)).toBeTruthy()
    expect(verifiableCredential.vc.credentialSchema.id).toEqual('did:ethr:rsk:0x8a32da624dd9fad8bf4f32d9456f374b60d9ad28;id=1eb2af6b-0dee-6090-cb55-0ed093f9b026;version=1.0')
    expect(verifiableCredential.credentialSubject.emailAddress).toEqual(emailAddress)
    expect(verifiableCredential.credentialSubject.id).toEqual(did)
    expect(verifiableCredential.issuer.id).toEqual(issuer.did)
  })
})
