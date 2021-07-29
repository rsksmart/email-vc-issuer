import { Logger } from '@rsksmart/rif-node-utils/lib/logger'
import { createTransport, createTestAccount, getTestMessageUrl } from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'

export const createTransporter = async (host: string, port: number, user: string, pass: string) => Promise.resolve(createTransport({
  host,
  port,
  secure: true,
  auth: { user, pass }
}))

export const createTestingTransporter = async () => {
  const testAccount = await createTestAccount()
  return createTransport({
    ...testAccount.smtp,
    auth: { user: testAccount.user, pass: testAccount.pass }
  })
}

export const emailTemplate = (user: string, text: string) => (to: string) => ({
  from: `"Email Verifier" <${user}>`,
  to,
  subject: 'VC Email Verification',
  text,
  html: `<p>${text}</p>`,
})

export class EmailSender {
  user: string
  mail: Mail

  constructor(user: string, transporter: Mail) {
    this.user = user
    this.mail = transporter
  }

  sendMail = (to: string, text: string) => this.mail.sendMail({
    from: `"Email Verifier" <${this.user}>`,
    to,
    subject: 'VC Email Verification',
    text,
    html: `<p>${text}</p>`,
  })

  static createTransporter = (host: string, port: number, user: string, pass: string) => {
    const transporter = createTransport({
      host,
      port,
      secure: true,
      auth: { user, pass }
    })

    return new EmailSender(user, transporter)
  }

  static createTestingTransporter = async () => {
    const testAccount = await createTestAccount()
    const transporter = createTransport({
      ...testAccount.smtp,
      auth: { user: testAccount.user, pass: testAccount.pass }
    })
    return new EmailSender(testAccount.user, transporter)
  }
}

export const createSendTestEmailVerificationCode = (emailSender: EmailSender, logger: Logger) => async (to: string, text: string) => {
  const info = await emailSender.sendMail(to, text)

  logger.info(`Email sent: ${info.messageId}`)
  logger.info(`Preview URL: ${getTestMessageUrl(info)}`)
}

export const createSendEmailVerificationCode = (emailSender: EmailSender, logger: Logger) => async (to: string, text: string) => {
  try {
    const info = await emailSender.sendMail(to, text)
    logger.info(`Email sent: ${info.messageId}`)
  } catch (e) {
    logger.error(e)
  }
}
