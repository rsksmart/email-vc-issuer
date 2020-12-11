import { Issuer, createVerifiableCredentialJwt } from 'did-jwt-vc'

export default class {
  issuer: Issuer

  constructor(issuer: Issuer) {
    this.issuer = issuer
  }

  createVerifiableCredentialFor(did: string, emailAddress: string) {
    return createVerifiableCredentialJwt({
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
        credentialSubject: { emailAddress },
      }
    }, this.issuer)
  }
}
