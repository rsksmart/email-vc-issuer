import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
export default class IssuedSmsVC {
  constructor (did: string, phoneNumber: string, jwt: string) {
    this.did = did
    this.phoneNumber = phoneNumber
    this.jwt = jwt
  }

  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  did!: string;

  @Column('text')
  phoneNumber!: string;

  @Column('text')
  jwt!: string;
}
