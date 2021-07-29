import { createEmailCredentialPayload, createPhoneNumberCredentialPayload, IssuedVC } from '../src/vc'
import { did, type, subject, jwt } from './utils'
import Ajv from 'ajv'
import emailCredentialSchema from '@rsksmart/vc-json-schemas/schema/EmailCredentialSchema/v1.0/schema.json'

const ajv = new Ajv()
const validateEmailSchema = ajv.compile(emailCredentialSchema.schema)
// TODO: Phone Schema validator

describe('vc', () => {
  test('=email vc payload', () => {
    const payload = createEmailCredentialPayload(did, subject)
    const expected = {
      sub: did,
      vc: {
        '@context': [
          'https://www.w3.org/2018/credentials/v1'
        ],
        type: [
          'VerifiableCredential',
          'Email'
        ],
        credentialSchema: {
          id: 'did:ethr:rsk:0x8a32da624dd9fad8bf4f32d9456f374b60d9ad28;id=1eb2af6b-0dee-6090-cb55-0ed093f9b026;version=1.0',
          type: 'JsonSchemaValidator2018'
        },
        credentialSubject: { emailAddress: subject },
      }
    }
    expect(+payload.issuanceDate).toBeLessThanOrEqual(+Date.now())
    expect(payload.sub).toEqual(expected.sub)
    expect(payload.vc).toEqual(expected.vc)
    expect(validateEmailSchema(expected.vc.credentialSubject)).toBeTruthy()
  })

  test('phone vc payload', () => {
    const payload = createPhoneNumberCredentialPayload(did, subject)
    const expected = {
      sub: did,
      vc: {
        '@context': [
          'https://www.w3.org/2018/credentials/v1'
        ],
        type: [
          'VerifiableCredential',
          'PhoneNumber'
        ],
        credentialSchema: {
          id: '???',
          type: 'JsonSchemaValidator2018'
        },
        credentialSubject: { phoneNumber: subject },
      }
    }
    expect(+payload.issuanceDate).toBeLessThanOrEqual(+Date.now())
    expect(payload.sub).toEqual(expected.sub)
    expect(payload.vc).toEqual(expected.vc)
  })

  test('issued vc', () => {
    const issuedVC = new IssuedVC(did, type, subject, jwt)
    expect(issuedVC.did).toEqual(did)
    expect(issuedVC.type).toEqual(type)
    expect(issuedVC.subject).toEqual(subject)
    expect(issuedVC.jwt).toEqual(jwt)
  })
})

