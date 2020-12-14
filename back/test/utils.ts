import { ecsign, hashPersonalMessage, toRpcSig } from 'ethereumjs-util'
import { Connection, createConnection } from 'typeorm'
import IssuedEmailVC from '../src/model/entities/issued-vc'
import fs from 'fs'
import DidCode from '../src/model/entities/did-code'

export const rpcPersonalSign = (msg: string, privateKey: Buffer) => {
  const msgHash = hashPersonalMessage(Buffer.from(msg))
  const { v, r, s } = ecsign(msgHash, privateKey)
  return toRpcSig(v, r, s)
}

export const createSqliteConnection = (database: string) => createConnection({
  type: 'sqlite',
  database,
  entities: [IssuedEmailVC, DidCode],
  logging: false,
  dropSchema: true,
  synchronize: true
})

export const resetDatabase = async (dbConnection: Connection) => {
  await dbConnection.dropDatabase()
  await dbConnection.synchronize()
}

export const deleteDatabase = (connection: Connection, database: string) => connection.close().then(() => {
  if (fs.existsSync(database)) fs.unlinkSync(database)
})
