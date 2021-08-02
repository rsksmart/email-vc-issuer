import dotenv from 'dotenv'
import { Connection } from 'typeorm'
import { Twilio } from 'twilio'
import { Logger } from '@rsksmart/rif-node-utils/lib/logger'
import { setupConfig, Config } from './config'
import { createLogger } from './logger'
import { createApp } from './server'
import { createIssuerIdentity } from './did'
import { setupApi } from './api'
import { createConnection } from './db'
import { TestEmailSender, EmailSender, SMSSender } from './senders'
import { VCIssuer } from './issuer'
import { createEmailCredentialPayload, createPhoneNumberCredentialPayload } from './vc'

console.log(`
██    ██  ██████     ██ ███████ ███████ ██    ██ ███████ ██████
██    ██ ██          ██ ██      ██      ██    ██ ██      ██   ██
██    ██ ██          ██ ███████ ███████ ██    ██ █████   ██████
 ██  ██  ██          ██      ██      ██ ██    ██ ██      ██   ██
  ████    ██████     ██ ███████ ███████  ██████  ███████ ██   ██
`)

dotenv.config()
const config = setupConfig(process.env)

console.log('Config', config)

const logger = createLogger(config.NODE_ENV, config.LOG_FILE, config.LOG_ERROR_FILE)

const app = createApp()

const identity = createIssuerIdentity(config.PRIVATE_KEY, config.NETWORK_NAME)
logger.info(`Service DID: ${identity.did}`)

async function setupServices(config: Config, connection: Connection, logger: Logger) {
  if (config.NODE_ENV === 'dev') {
    logger.info(`Setting up testing mail sender...`)
    const sender = await TestEmailSender.create(logger)
    const emailVCIssuer = new VCIssuer('Email', createEmailCredentialPayload, connection, identity, sender)
    logger.info(`Testing mail sender ready`)
    return [emailVCIssuer]
  }

  if (config.NODE_ENV === 'production') {
    const services: VCIssuer[] = []

    if(config.smtpConfig) {
      logger.info(`Setting up mail sender...`)
      const sender = new EmailSender(config.smtpConfig.SMTP_HOST, config.smtpConfig.SMTP_PORT, config.smtpConfig.SMTP_USER, config.smtpConfig.SMTP_PASS, logger)
      const emailVCIssuer = new VCIssuer('Email', createEmailCredentialPayload, connection, identity, sender)
      logger.info(`Mail sender ready`)
      services.push(emailVCIssuer)
    }

    if(config.twilioConfig) {
      logger.info(`Setting up SMS sender...`)
      const twilio = new Twilio(config.twilioConfig.TWILIO_ACCOUNT_SID, config.twilioConfig.TWILIO_AUTH_TOKEN);
      const sender = new SMSSender(twilio, config.twilioConfig.TWILIO_PHONE_NUMBER, logger)
      const phoneVCIssuer = new VCIssuer('Phone', createPhoneNumberCredentialPayload, connection, identity, sender)
      logger.info(`SMS sender ready`)
      services.push(phoneVCIssuer)
    }

    return services
  }
}

async function main () {
  const connection = await createConnection()

  const services = await setupServices(config, connection, logger)

  for (const issuer of services!) {
    logger.info(`Setting up API for ${issuer.credentialType} credentials`)
    setupApi(app, `/${issuer.credentialType.toLowerCase()}`, issuer, logger)

  }

  app.listen(config.PORT, () => logger.info(`VC Issuer running at http://localhost:${config.PORT}`))
}

main()
