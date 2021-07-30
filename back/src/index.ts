import dotenv from 'dotenv'
import { setupConfig } from './config'
import { createLogger } from './logger'
import { createApp } from './server'
import { createIssuerIdentity } from './did'
import { setupApi } from './api'
import { createConnection } from './db'
import { Twilio } from 'twilio'
import { EmailSender, createSendTestEmailVerificationCode, createSendEmailVerificationCode } from './email'
import { VCIssuer } from './issuer'
import { createEmailCredentialPayload, createPhoneNumberCredentialPayload } from './vc'
import { createSendSMSVerificationCode } from './sms'

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

// this enables cross-origin requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin as string)
  next()
})

const identity = createIssuerIdentity(config.PRIVATE_KEY, config.NETWORK_NAME)
logger.info(`Service DID: ${identity.did}`)

async function main () {
  let emailSender: EmailSender
  let sendEmailVerificationCode

  if (config.NODE_ENV === 'dev') {
    logger.info(`Setting up testing mail sender`)
    emailSender = await EmailSender.createTestingTransporter()
    sendEmailVerificationCode = createSendTestEmailVerificationCode(emailSender, logger)
  } else {
    logger.info(`Setting up mail sender`)
    emailSender = EmailSender.createTransporter(config.SMTP_HOST!, Number(config.SMTP_PORT!), config.SMTP_USER!, config.SMTP_PASS!)
    sendEmailVerificationCode = createSendEmailVerificationCode(emailSender, logger)
  }

  const connection = await createConnection()

  const emailVCIssuer = new VCIssuer(identity, connection, 'Email', createEmailCredentialPayload)
  setupApi(app, '/email', emailVCIssuer, sendEmailVerificationCode, logger)
  logger.info(`Email verificatoins feature ready`)

  if (config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN && config.TWILIO_PHONE_NUMBER) {
    logger.info(`Setting up phone verificatoins`)
    const twilio = new Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
    const sendSmsVerificationCode = createSendSMSVerificationCode(twilio, config.TWILIO_PHONE_NUMBER, logger)

    const phoneVCIssuer = new VCIssuer(identity, connection, 'PhoneNumber', createPhoneNumberCredentialPayload)
    setupApi(app, '/phone', phoneVCIssuer, sendSmsVerificationCode, logger)
    logger.info(`Phone verificatoins feature ready`)
  }

  app.listen(config.PORT, () => logger.info(`VC Issuer running at http://localhost:${config.PORT}`))
}

main()
