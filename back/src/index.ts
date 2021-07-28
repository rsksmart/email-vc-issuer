import { setupConfig } from './config'
import { createLogger } from './logger'
import { createApp } from './server'
import { createIssuer } from './identity'

import nodemailer from 'nodemailer'
import EmailVCIssuerInterface from './model/EmailVCIssuerInterface'
import { setupService, setupSmsService } from './api'

import SMTPTransport from 'nodemailer/lib/smtp-transport'
import { createConnection } from 'typeorm'
import IssuedEmailVC from './model/entities/issued-vc'
import IssuedSmsVC from './model/entities/issued-vc-sms'
import DidCode from './model/entities/did-code'
import SmsVCIssuerInterface from './model/SmsVCIssuerInterface'
import { Twilio } from 'twilio'
import { EmailSender } from './email'

const config = setupConfig()

const logger = createLogger(config.NODE_ENV, config.LOG_FILE, config.LOG_ERROR_FILE)

const app = createApp()

const issuer = createIssuer(config.PRIVATE_KEY, config.NETWORK_NAME)
logger.info(`Service DID: ${issuer.did}`)

const decorateVerificationCode = (code: string) => `Verification code: ${code}`

// https://nodemailer.com/
async function sendVerificationCode(to: string, text: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = config
  const isProd = SMTP_PORT && SMTP_HOST && SMTP_USER && SMTP_PASS

  let emailSender

  if (isProd) {
    emailSender = await EmailSender.createTransporter(SMTP_HOST!, Number(SMTP_PORT!), SMTP_USER!, SMTP_PASS!)
  } else {
    emailSender = await EmailSender.createTestingTransporter()
  }

  const info = await emailSender.sendMail(to, text)

  logger.info(`Email sent: ${info.messageId}`)
  if (!isProd) logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
}

async function sendSmsVerificationCode(to: string, text: string) {
  return new Promise<void>((resolve: (msg: any) => void, reject: (err: Error) => void) => {

    if ((config.TWILIO_ACCOUNT_SID === undefined) || (config.TWILIO_AUTH_TOKEN === undefined)) {
      reject(new Error('TWILIO settings missing')); return;
    }

    const client = new Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
    client.messages
      .create({ to, from: config.TWILIO_PHONE_NUMBER, body: text })
      .then((message: any) => {
        console.log(`Message Sent ${message.sid}`);
        resolve(`Message Sent ${message.sid}`);
      })
      .catch((error: Error) => {
        console.log(`error: ${error}`);
        reject(error);
      });
  });
}

createConnection({
  type: 'sqlite',
  database: 'vc-issuer.sqlite',
  entities: [IssuedEmailVC, IssuedSmsVC, DidCode],
  logging: false,
  dropSchema: false,
  synchronize: true
})
.then(dbConnection => {
  
  let emailVCIssuerInterface = new EmailVCIssuerInterface(issuer, dbConnection, decorateVerificationCode)
  let smsVCIssuerInterface = new SmsVCIssuerInterface(issuer, dbConnection, decorateVerificationCode)

  setupService(app, { emailVCIssuerInterface, sendVerificationCode }, logger)
  setupSmsService(app, { smsVCIssuerInterface, sendSmsVerificationCode }, logger)
});

const port = config.PORT || 5108

app.listen(port, () => console.log(`VC Issuer running at http://localhost:${port}`))
