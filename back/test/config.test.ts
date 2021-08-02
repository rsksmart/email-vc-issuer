import { setupConfig } from '../src/config'
import { issuerPrivateKey } from './utils'

describe('config', () => {
  test('private key is required', () => expect(() => setupConfig({})).toThrow())

  test('invalid env', () => expect(() => setupConfig({
    PRIVATE_KEY: issuerPrivateKey,
    NODE_ENV: 'bad'
  })).toThrow())

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

  test('smtp', () => {
    const smtpConfig = {
      SMTP_HOST: 'SMTP_HOST',
      SMTP_PORT: '1000',
      SMTP_USER: 'SMTP_USER',
      SMTP_PASS: 'SMTP_PASS'
    }

    const config = setupConfig({
      PRIVATE_KEY: issuerPrivateKey,
      ...smtpConfig
    })

    expect(config.smtpConfig).toEqual({
      ...smtpConfig,
      SMTP_PORT: 1000
    })
  })

  test('twilio', () => {
    const twilioConfig = {
      TWILIO_AUTH_TOKEN: 'TWILIO_AUTH_TOKEN',
      TWILIO_ACCOUNT_SID: 'TWILIO_ACCOUNT_SID',
      TWILIO_PHONE_NUMBER: 'TWILIO_PHONE_NUMBER'
    }

    const config = setupConfig({
      PRIVATE_KEY: issuerPrivateKey,
      ...twilioConfig
    })

    expect(config.twilioConfig).toEqual(twilioConfig)
  })
})
