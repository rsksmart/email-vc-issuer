import express from 'express'
import cors from 'cors'
import nodemailer from 'nodemailer'
import { rskDIDFromPrivateKey, rskTestnetDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'
import EmailVCIssuerInterface from './model/EmailVCIssuerInterface'
import { setupService, setupSmsService } from './api'
import dotenv from 'dotenv'
import { loggerFactory } from '@rsksmart/rif-node-utils'
import rateLimit from 'express-rate-limit'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import { createConnection } from 'typeorm'
import IssuedEmailVC from './model/entities/issued-vc'
import IssuedSmsVC from './model/entities/issued-vc-sms'
import DidCode from './model/entities/did-code'
import SmsVCIssuerInterface from './model/SmsVCIssuerInterface'
import { Twilio } from 'twilio'

dotenv.config()

const logger = loggerFactory({
  env: process.env.NODE_ENV || 'dev',
  infoFile: process.env.LOG_FILE || './log/email-vc-issuer.log',
  errorFile: process.env.LOG_ERROR_FILE || './log/email-vc-issuer.log'
})('email-vc-issuer')

const app = express()
app.use(cors())

const limiter = rateLimit({
  windowMs: 1000, // 1 minute
  max: 5
});
 
app.use(limiter);

app.get('/__health', (req, res) => {
  res.status(200).end('OK')
})

const privateKey = process.env.PRIVATE_KEY!
const issuer = process.env.networkName === 'rsk:testnet' ? rskTestnetDIDFromPrivateKey()(privateKey) : rskDIDFromPrivateKey()(privateKey)
logger.info(`Service DID: ${issuer.did}`)

const decorateVerificationCode = (code: string) => `Verification code: ${code}`

// https://nodemailer.com/
async function sendVerificationCode(to: string, text: string) {
  let transport: SMTPTransport.Options
  let printMailUrl = false

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env

  if (SMTP_PORT && SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transport = {
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    }
  } else {
    // use ethereal
    const testSmtp = await nodemailer.createTestAccount()

    transport = {
      ...testSmtp.smtp,
      auth: { user: testSmtp.user, pass: testSmtp.pass }
    }

    printMailUrl = true
  }

  const transporter = nodemailer.createTransport(transport);

  const info = await transporter.sendMail({
    from: `"Email Verifier" <${transport.auth?.user}>`,
    to,
    subject: 'VC Email Verification',
    text,
    html: `<p>${text}</p>`,
  });

  logger.info(`Email sent: ${info.messageId}`)
  if (printMailUrl) logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
}

async function sendSmsVerificationCode(to: string, text: string) {
  return new Promise<void>((resolve: (msg: any) => void, reject: (err: Error) => void) => {

    if ((process.env.TWILIO_ACCOUNT_SID === undefined) || (process.env.TWILIO_AUTH_TOKEN === undefined)) {
      reject(new Error('TWILIO settings missing')); return;
    }

    const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    client.messages
      .create({ to, from: process.env.TWILIO_PHONE_NUMBER, body: text })
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

  app.get('/about', (_, res) => {
    res.status(200).send(`VC Issuer - Read more at <a href="https://github.com/rsksmart/email-vc-issuer">github.com/rsksmart/email-vc-issuer</a>`)
  })
});

const port = process.env.PORT || 5108

app.listen(port, () => console.log(`VC Issuer running at http://localhost:${port}`))
