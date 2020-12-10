import express from 'express'
import cors from 'cors'
import nodemailer from 'nodemailer'
import { rskDIDFromPrivateKey, rskTestnetDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'
import EmailVCIssuerInterface from './model/EmailVCIssuerInterface'
import { setupService } from './api'
import dotenv from 'dotenv'
import { loggerFactory } from '@rsksmart/rif-node-utils'

dotenv.config()

const logger = loggerFactory({
  env: process.env.NODE_ENV || 'dev',
  infoFile: process.env.LOG_FILE || './log/email-vc-issuer.log',
  errorFile: process.env.LOG_ERROR_FILE || './log/email-vc-issuer.log'
})('email-vc-issuer')

const app = express()
app.use(cors())

const privateKey = process.env.PRIVATE_KEY!
const issuer = process.env.networkName === 'rsk:testnet' ? rskTestnetDIDFromPrivateKey()(privateKey) : rskDIDFromPrivateKey()(privateKey)
logger.info(`Service DID: ${issuer.did}`)

const decorateVerificationCode = (code: string) => `Verification code: ${code}`

const emailVCIssuerInterface = new EmailVCIssuerInterface(issuer, decorateVerificationCode)

// https://nodemailer.com/
async function sendVerificationCode(to: string, text: string) {
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  let info = await transporter.sendMail({
    from: `"Email Verifier" <${process.env.SMTP_USER}>`,
    to,
    subject: 'VC Email Verification',
    text,
    html: `<p>${text}</p>`,
  });

  logger.info(`Email sent: ${info.messageId}`)
}

setupService(app, {
  emailVCIssuerInterface,
  sendVerificationCode
})

const port = process.env.PORT || 5108

app.listen(port, () => console.log(`Email VC Issuer running at http://localhost:${port}`))
