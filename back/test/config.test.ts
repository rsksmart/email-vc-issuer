import { setupConfig } from '../src/config'
import { issuerPrivateKey } from './utils'

describe('config', () => {
  test('private key is required', () => expect(() => setupConfig({})).toThrow())
  test('defaults', () => {
    const config = setupConfig({
      PRIVATE_KEY: issuerPrivateKey
    })

    expect(config.NETWORK_NAME).toEqual('rsk')
    expect(config.PORT).toEqual(5108)
    expect(config.NODE_ENV).toEqual('dev')
    expect(config.PORT).toBeDefined()
    expect(config.PORT).toBeDefined()
  })
})
