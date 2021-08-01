import { Express } from 'express'
import bodyParser from 'body-parser'
import { Logger } from '@rsksmart/rif-node-utils/lib/logger'
import { IVCIssuer } from './issuer'

export type SendVerificationCode = (to: string, text: string) => Promise<void>

export function setupApi(app: Express, prefix: string, vcIssuer: IVCIssuer, sendVerificationCode: SendVerificationCode, logger: Logger): void {
  app.post(prefix + '/requestVerification/:did', bodyParser.json(), async (req, res) => {
    const { did } = req.params
    const { subject } = req.body

    if ((subject === undefined) || (subject === '')) return res.status(500).send('Subject not set')

    logger.info(`Requested verification - type: ${vcIssuer.credentialType} - subject: ${subject} - did: ${did}`)

    try {
      const verificationCode = await vcIssuer.requestVerification(did, subject)
      await sendVerificationCode(subject, verificationCode)
      logger.info(`Verification code sent`)
      return res.status(200).send()
    } catch (e) {
      const title = 'Error sending verification code'
      logger.error(title, e)
      return res.status(500).send(title)
    }
  })

  app.post(prefix + '/verify/:did', bodyParser.json(), async (req, res) => {
    const { did } = req.params
    const { sig } = req.body

    try {
      const jwt = await vcIssuer.verify(did, sig)
      logger.info(`Email Credential issued for did ${did}`)
      return res.status(200).send({ jwt })
    } catch (e) {
      const title = 'Error verifying'
      logger.error(title, e)
      return res.status(500).send(title)
    }
  })
}
