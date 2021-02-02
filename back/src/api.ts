import { Express } from 'express'
import bodyParser from 'body-parser'
import EmailVCIssuerInterface from './model/EmailVCIssuerInterface'
import { Logger } from '@rsksmart/rif-node-utils/lib/logger'

interface Options {
  emailVCIssuerInterface: EmailVCIssuerInterface
  sendVerificationCode: (to: string, text: string) => Promise<void>
}

export const UNHANDLED_ERROR_MESSAGE = 'Unhandled error'

export function setupService(app: Express, { emailVCIssuerInterface, sendVerificationCode }: Options, logger: Logger) {
  app.post('/requestVerification/:did', bodyParser.json(), async (req, res) => {
    const { did } = req.params
    const { emailAddress } = req.body

    logger.info(`Requested verification for email ${emailAddress} with did ${did}`)

    const verificationCode = await emailVCIssuerInterface.requestVerificationFor(did, emailAddress)

    sendVerificationCode(emailAddress, verificationCode)

    res.status(200).send()
  })

  app.post('/verify/:did', bodyParser.json(), async (req, res) => {
    const { did } = req.params
    const { sig } = req.body

    try {
      const jwt = await emailVCIssuerInterface.verify(did, sig)
      logger.info(`Email Credential issued for did ${did}`)
      res.status(200).send({ jwt })
    } catch (e) {
      logger.error('Caught error when issuing VC', e)
      res.status(500).send(UNHANDLED_ERROR_MESSAGE)
    }
  })
}
