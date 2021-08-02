import { Logger } from '@rsksmart/rif-node-utils/lib/logger'
import { createTransport } from 'nodemailer'
import { Sender } from './sender'
import Mail from 'nodemailer/lib/mailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

export class EmailSender extends Sender<any> {
  user: string
  mail: Mail

  constructor(options: SMTPTransport.Options, logger: Logger) {
    super(logger)

    if(!options.auth || !options.auth.user) {
      throw new Error('Invlaid SMTP setup')
    }

    this.user = options.auth.user
    this.mail = createTransport(options)
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  sendVerificationCode = (to: string, text: string): Promise<any> => this.mail.sendMail({
    from: `"Email Verifier" <${this.user}>`,
    to,
    subject: 'VC Email Verification',
    text,
    html: `<p>${text}</p>`,
  })

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  logSendResult(result: any): void {
    this.logger.info(`Email sent: ${result.messageId}`)
  }

  static createEmailSender(host: string, port: number, user: string, pass: string, logger: Logger): EmailSender {
    return new EmailSender({
      host,
      port,
      secure: true,
      auth: { user, pass }
    }, logger)
  }
}
