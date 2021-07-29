import { randomBytes }  from 'crypto'
import { Entity, Column, PrimaryColumn } from 'typeorm'

export const decorateVerificationCode = (code: string) => `Verification code: ${code}`

@Entity()
export class VerificationRequest {
  constructor (did: string, type: string, subject: string, codeSize: number = 32, expirationTime = 600000) { // default expiration 10 min
    this.did = did
    this.type = type
    this.subject = subject

    this.code = randomBytes(codeSize).toString('hex')
    this.expirationTime = Date.now() + expirationTime
  }

  @PrimaryColumn()
  did!: string;

  @Column('text')
  type!: string;

  @Column('text')
  subject!: string;

  @Column('text')
  code!: string;

  @Column('integer')
  expirationTime!: number;

  hasExpired() {
    return Date.now() > this.expirationTime
  }
}
