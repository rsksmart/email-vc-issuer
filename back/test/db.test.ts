import { createConnection } from '../src/db'

describe('db', () => {
  test('create connection', async () => {
    const connection = await createConnection()
    expect(connection.isConnected).toBeTruthy()
    await connection.close()
  })
})
