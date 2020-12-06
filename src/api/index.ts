import { Issuer } from 'did-jwt-vc'
import { Express } from 'express'
import bodyParser from 'body-parser'
import EmailVCIssuerInterface, { DecorateVerificationCode } from '../model/EmailVCIssuerInterface'

export function setupService(app: Express, options: {
  issuer: Issuer
  decorateVerificationCode: DecorateVerificationCode,
  sendVerificationCode: (to: string, text: string) => Promise<void>
}) {
  const emailVCIssuerInterface = new EmailVCIssuerInterface(options.issuer, options.decorateVerificationCode)

  app.post('/requestVerification/:did', bodyParser.json(), (req, res) => {
    const { did } = req.params
    const { emailAddress } = req.body

    const verificationCode = emailVCIssuerInterface.requestVerificationFor(did, emailAddress)

    options.sendVerificationCode(emailAddress, verificationCode)

    res.status(200).send()
  })

  app.post('/verify/:did', bodyParser.json(), async (req, res) => {
    const { did } = req.params
    const { sig } = req.body

    try {
      const jwt = await emailVCIssuerInterface.verify(did, sig)
      res.status(200).send({ jwt })
    } catch (e) {
      res.status(500).send(e.message)
    }
  })
}
