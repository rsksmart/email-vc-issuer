import { Connection, createConnection as _createConnection } from 'typeorm'
import { VerificationRequest } from './verificationRequest'
import { IssuedVC } from './vc'

export const createConnection = (): Promise<Connection> => _createConnection({
  type: 'sqlite',
  database: 'vc-issuer.sqlite',
  entities: [VerificationRequest, IssuedVC],
  logging: false,
  dropSchema: false,
  synchronize: true
})
