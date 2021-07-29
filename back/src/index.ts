import dotenv from 'dotenv'
import { setupConfig } from './config'
import { createLogger } from './logger'
import { createApp } from './server'
import { createIssuerDID } from './did'
import { setupApi } from './api'
import { createConnection } from './db'
import { Twilio } from 'twilio'
import { EmailSender, createSendTestEmailVerificationCode, createSendEmailVerificationCode } from './email'
import { VCIssuer } from './issuer'
import { createEmailCredentialPayload, createPhoneNumberCredentialPayload } from './vc'
import { SendVerificationCode } from './types'
import { createSendSMSVerificationCode } from './sms'

dotenv.config()
const config = setupConfig(process.env)

const logger = createLogger(config.NODE_ENV, config.LOG_FILE, config.LOG_ERROR_FILE)

const app = createApp()

const identity = createIssuerDID(config.PRIVATE_KEY, config.NETWORK_NAME)
logger.info(`Service DID: ${identity.did}`)

async function main () {
  let emailSender: EmailSender
  let sendEmailVerificationCode: SendVerificationCode

  if (config.NODE_ENV === 'dev') {
    emailSender = await EmailSender.createTestingTransporter()
    sendEmailVerificationCode = createSendTestEmailVerificationCode(emailSender, logger)
  } else {
    emailSender = EmailSender.createTransporter(config.SMTP_HOST!, Number(config.SMTP_PORT!), config.SMTP_USER!, config.SMTP_PASS!)
    sendEmailVerificationCode = createSendEmailVerificationCode(emailSender, logger)
  }

  const connection = await createConnection()

  const emailVCIssuer = new VCIssuer(identity, connection, 'Email', createEmailCredentialPayload)
  setupApi(app, '/email', emailVCIssuer, sendEmailVerificationCode, logger)

  if (config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN && config.TWILIO_PHONE_NUMBER) {
    const twilio = new Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
    const sendSmsVerificationCode = createSendSMSVerificationCode(twilio, config.TWILIO_PHONE_NUMBER, logger)

    const smsVCIssuer = new VCIssuer(identity, connection, 'PhoneNumber', createPhoneNumberCredentialPayload)
    setupApi(app, '/phone', smsVCIssuer, sendSmsVerificationCode, logger)
  }

  const port = config.PORT

  app.listen(port, () => console.log(`VC Issuer running at http://localhost:${port}`))
}

main()
