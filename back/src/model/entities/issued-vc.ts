import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
export default class IssuedEmailVC {
  constructor (did: string, emailAddress: string, jwt: string) {
    this.did = did
    this.emailAddress = emailAddress
    this.jwt = jwt
  }

  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  did!: string;

  @Column('text')
  emailAddress!: string;

  @Column('text')
  jwt!: string;
}
