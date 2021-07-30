import { JwtCredentialPayload } from 'did-jwt-vc'
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'

export const createEmailCredentialPayload = (sub: string, emailAddress: string): JwtCredentialPayload => ({
  issuanceDate: new Date(),
  sub,
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
})

export const createPhoneNumberCredentialPayload = (sub: string, phoneNumber: string): JwtCredentialPayload => ({
  issuanceDate: new Date(),
  sub,
  vc: {
    '@context': [
      'https://www.w3.org/2018/credentials/v1'
    ],
    type: [
      'VerifiableCredential',
      'Phone'
    ],
    credentialSchema: {
      id: 'did:ethr:rsk:0x8a32da624dd9fad8bf4f32d9456f374b60d9ad28;id=41ab7167-d98a-4572-b8de-fcc32289728c;version=1.0',
      type: 'JsonSchemaValidator2018'
    },
    credentialSubject: { phoneNumber },
  }
})

@Entity()
export class IssuedVC {
  constructor(did: string, type: string, subject: string, jwt: string) {
    this.did = did
    this.type = type
    this.subject = subject
    this.jwt = jwt
  }

  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  @Index()
  did!: string;

  @Column('text')
  @Index()
  type!: string

  @Column('text')
  @Index()
  subject!: string

  @Column('text')
  jwt!: string;
}
