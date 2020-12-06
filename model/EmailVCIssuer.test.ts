import EmailVCIssuer from './EmailVCIssuer'
import Ajv from 'ajv'
import emailCredentialSchema from '@rsksmart/vc-json-schemas/schema/EmailCredentialSchema/v1.0/schema.json'
import { Resolver } from 'did-resolver'
import { getResolver } from 'ethr-did-resolver'
import EthrDID from '@rsksmart/ethr-did'
import { verifyCredential } from 'did-jwt-vc'

const issuer = new EthrDID({
  address: '0x7009cdcbe41dd62dd7e6ccfd8b76893207fbba68',
  privateKey: '3b9c8ea990c87091eca8ed8e82edf73c6b1c37fe7640e95460cedff09bdf21ff',
  method: 'ethr:rsk'
})

const resolver = new Resolver(getResolver({
  networks: [
    { name: 'rsk', registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b", rpcUrl: "https://did.rsk.co:4444" }
  ]
}))

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
