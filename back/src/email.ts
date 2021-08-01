import { Logger } from '@rsksmart/rif-node-utils/lib/logger'
import { createTransport, createTestAccount, getTestMessageUrl } from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'

export class EmailSender {
  user: string
  mail: Mail

  constructor(user: string, transporter: Mail) {
    this.user = user
    this.mail = transporter
  }

  sendMail = (to: string, text: string): Promise<any> => this.mail.sendMail({
    from: `"Email Verifier" <${this.user}>`,
    to,
    subject: 'VC Email Verification',
    text,
    html: `<p>${text}</p>`,
  })

  static createTransporter(host: string, port: number, user: string, pass: string): EmailSender {
    const transporter = createTransport({
      host,
      port,
      secure: true,
      auth: { user, pass }
    })

    return new EmailSender(user, transporter)
  }

  static async createTestingTransporter(): Promise<EmailSender> {
    const testAccount = await createTestAccount()
    const transporter = createTransport({
      ...testAccount.smtp,
      auth: { user: testAccount.user, pass: testAccount.pass }
    })
    return new EmailSender(testAccount.user, transporter)
  }
}

type SendEmialVerificatoinCode = (emailSender: EmailSender, logger: Logger) => (to: string, text: string) => Promise<void>

export const createSendEmailVerificationCode: SendEmialVerificatoinCode = (emailSender, logger) => async (to, text) => {
  try {
    const info = await emailSender.sendMail(to, text)
    logger.info(`Email sent: ${info.messageId}`)
  } catch (e) {
    logger.error(e)
  }
}

export const createSendTestEmailVerificationCode: SendEmialVerificatoinCode = (emailSender, logger) => async (to, text) => {
  const info = await emailSender.sendMail(to, text)

  logger.info(`Email sent: ${info.messageId}`)
  logger.info(`Preview URL: ${getTestMessageUrl(info)}`)
}
