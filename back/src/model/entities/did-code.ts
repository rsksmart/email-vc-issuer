import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from 'typeorm'

@Entity()
export default class DidCode {
  constructor (did: string, code: string, expiresIn = 600000) { // default expiration 10 min
    this.did = did
    this.code = code
    this.expirationTime = Date.now() + expiresIn
  }

  @PrimaryColumn()
  did!: string;

  @Column('text')
  code!: string;

  @Column('integer')
  expirationTime!: number;
}
