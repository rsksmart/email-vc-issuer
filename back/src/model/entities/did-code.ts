import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
export default class DidCode {
  constructor (did: string, code: string, expiresIn = 600000) { // default expiration 10 min
    this.did = did
    this.code = code
    this.expirationTime = Date.now() + expiresIn
  }

  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  did!: string;

  @Column('text')
  code!: string;

  @Column('integer')
  expirationTime!: number;
}
