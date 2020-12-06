const express = require('express')
const nodemailer = require("nodemailer")
const EthrDID = require('@rsksmart/ethr-did')
const { setupService } = require('../api')

const app = express()

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

export const issuer =  new EthrDID({
  address: '0x7009cdcbe41dd62dd7e6ccfd8b76893207fbba68',
  privateKey: '3b9c8ea990c87091eca8ed8e82edf73c6b1c37fe7640e95460cedff09bdf21ff',
  method: 'ethr:rsk'
})

setupService(app, {
  issuer,
  decorateVerificationCode: (code: string) => `Verification code: ${code}`,
  sendVerificationCode
})

app.listen(3500, (port: string) => `App running at ${port}`)
