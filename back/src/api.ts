import { Application } from 'express'
import bodyParser from 'body-parser'
import { Logger } from '@rsksmart/rif-node-utils/lib/logger'
import { IVCIssuer } from './issuer'

export function setupApi(app: Application, prefix: string, vcIssuer: IVCIssuer, logger: Logger): void {
  app.post(prefix + '/requestVerification/:did', bodyParser.json(), async (req, res) => {
    const { did } = req.params
    const { subject } = req.body

    if ((subject === undefined) || (subject === '')) return res.status(500).send('Subject not set')

    logger.info(`Requested verification - type: ${vcIssuer.credentialType} - subject: ${subject} - did: ${did}`)

    try {
      const verificationCode = await vcIssuer.requestVerification(did, subject)
      logger.info(`Verification code sent`, verificationCode)
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
