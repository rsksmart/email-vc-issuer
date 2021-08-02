import { Logger } from '@rsksmart/rif-node-utils/lib/logger'
import { createTransport } from 'nodemailer'
import { Sender } from './sender'
import Mail from 'nodemailer/lib/mailer'

export class EmailSender extends Sender<any> {
  user: string
  mail: Mail

  constructor(host: string, port: number, user: string, pass: string, logger: Logger) {
    super(logger)

    this.user = user

    this.mail = createTransport({
      host,
      port,
      secure: true,
      auth: { user, pass }
    })
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
}
