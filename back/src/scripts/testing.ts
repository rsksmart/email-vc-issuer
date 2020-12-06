import express from 'express'
import cors from 'cors'
import nodemailer from 'nodemailer'
import EthrDID from '@rsksmart/ethr-did'
import EmailVCIssuerInterface from '../model/EmailVCIssuerInterface'
import { setupService } from '../api'

const app = express()
app.use(cors())

export const issuer =  new EthrDID({
  address: '0x7009cdcbe41dd62dd7e6ccfd8b76893207fbba68',
  privateKey: '3b9c8ea990c87091eca8ed8e82edf73c6b1c37fe7640e95460cedff09bdf21ff',
  method: 'ethr:rsk'
})

const decorateVerificationCode = (code: string) => `Verification code: ${code}`

const emailVCIssuerInterface = new EmailVCIssuerInterface(issuer, decorateVerificationCode)

// https://nodemailer.com/
async function sendVerificationCode(to: string, text: string) {
  let testAccount = await nodemailer.createTestAccount();

  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  let info = await transporter.sendMail({
    from: '"Email Verifier" <foo@example.com>',
    to,
    subject: "VC Email Verification",
    text,
    html: `<p>${text}</p>`,
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

setupService(app, {
  emailVCIssuerInterface,
  sendVerificationCode
})

const port = 3500

app.listen(port, () => console.log(`Email VC Issuer running at http://localhost:${port}`))
