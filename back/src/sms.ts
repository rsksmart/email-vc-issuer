import { Logger } from '@rsksmart/rif-node-utils/lib/logger'
import { Twilio } from 'twilio'

export const createSendSMSVerificationCode = (twilio: Twilio, from: string, logger: Logger) => async (to: string, body: string) => {
  const message = await twilio.messages.create({ from, to, body })
  logger.info(`SMS sent: ${message.sid}`)
}
