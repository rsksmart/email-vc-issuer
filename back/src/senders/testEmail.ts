import { Logger } from '@rsksmart/rif-node-utils/lib/logger'
import { createTestAccount, getTestMessageUrl } from 'nodemailer'
import { EmailSender } from './email'

export class TestEmailSender extends EmailSender {
  static async createTestEmailSender(logger: Logger): Promise<any> {
    const testAccount = await createTestAccount()
    return new TestEmailSender({
      ...testAccount.smtp,
      auth: { user: testAccount.user, pass: testAccount.pass }
    }, logger)
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  logSendResult(result: any): void {
    super.logSendResult(result)
    this.logger.info(`Preview URL: ${getTestMessageUrl(result)}`)
  }
}
