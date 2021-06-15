import { Issuer, createVerifiableCredentialJwt } from 'did-jwt-vc'
import { Repository } from 'typeorm'
import IssuedSmsVC from './entities/issued-vc-sms'

export default class {
  constructor(
    private issuer: Issuer, 
    private repository: Repository<IssuedSmsVC>
  ) { }

  async createVerifiableCredentialFor(did: string, phoneNumber: string) {
    const exists = await this.repository.findOne({
      where: { did, phoneNumber },
      select: ['jwt']
    })

    if (exists) return exists.jwt

    return createVerifiableCredentialJwt({
        issuanceDate: new Date(),
        sub: did,
        vc: {
          '@context': [
            'https://www.w3.org/2018/credentials/v1'
          ],
          type: [
            'VerifiableCredential',
            'SMS'
          ],
          credentialSchema: {
            id: 'did:ethr:rsk:0x8a32da624dd9fad8bf4f32d9456f374b60d9ad28;id=1eb2af6b-0dee-6090-cb55-0ed093f9b026;version=1.0',
            type: 'JsonSchemaValidator2018'
          },
          credentialSubject: { phoneNumber },
        }
      }, this.issuer)
    .then(jwt => this.repository.save(new IssuedSmsVC(did, phoneNumber, jwt)))
    .then(({ jwt }) => jwt)
  }
}
