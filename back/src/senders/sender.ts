import { Logger } from '@rsksmart/rif-node-utils/lib/logger'

export type SendVerificationCode = (to: string, text: string) => Promise<any>

export abstract class Sender<SendResult> {
  logger: Logger

  constructor(logger: Logger) {
    this.logger = logger
  }

  abstract logSendResult(result: SendResult): void
  abstract sendVerificationCode: SendVerificationCode

  async send(to: string, text: string): Promise<any> {
    try {
      const result = await this.sendVerificationCode(to, text)
      this.logSendResult(result)
      return result
    } catch (e: any) {
      this.logger.error(e)
    }
  }
}
