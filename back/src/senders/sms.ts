import { Logger } from '@rsksmart/rif-node-utils/lib/logger'
import { Twilio } from 'twilio'
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message'
import { Sender } from './sender'

export class SMSSender extends Sender<MessageInstance> {
  twilio: Twilio
  from: string

  constructor(twilio: Twilio, from: string, logger: Logger) {
    super(logger)
    this.twilio = twilio
    this.from = from
  }

  logSendResult = (result: MessageInstance): void => {
    this.logger.info(`SMS sent: ${result.sid}`)
  }
  sendVerificationCode = (to: string, text: string): Promise<any>  => this.twilio.messages.create({ from: this.from, to, body: text })
}
