import { Logger } from '@rsksmart/rif-node-utils/lib/logger'
import { Twilio } from 'twilio'

export const createSendSMSVerificationCode = (twilio: Twilio, from: string, logger: Logger): (to: string, body: string) => Promise<void> => async (to, body) => {
  const message = await twilio.messages.create({ from, to, body })
  logger.info(`SMS sent: ${message.sid}`)
}
