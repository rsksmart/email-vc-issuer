import express from 'express'
import cors from 'cors'
import nodemailer from 'nodemailer'
import { rskDIDFromPrivateKey, rskTestnetDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'
import EmailVCIssuerInterface from './model/EmailVCIssuerInterface'
import { setupService } from './api'
import dotenv from 'dotenv'
import { loggerFactory } from '@rsksmart/rif-node-utils'
import rateLimit from 'express-rate-limit'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

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

const emailVCIssuerInterface = new EmailVCIssuerInterface(issuer, decorateVerificationCode)

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

setupService(app, { emailVCIssuerInterface, sendVerificationCode }, logger)

const port = process.env.PORT || 5108

app.listen(port, () => console.log(`Email VC Issuer running at http://localhost:${port}`))
