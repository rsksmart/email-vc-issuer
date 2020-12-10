import { Express } from 'express'
import bodyParser from 'body-parser'
import EmailVCIssuerInterface from '../model/EmailVCIssuerInterface'

interface Options {
  emailVCIssuerInterface: EmailVCIssuerInterface
  sendVerificationCode: (to: string, text: string) => Promise<void>
}

export function setupService(app: Express, { emailVCIssuerInterface, sendVerificationCode }: Options) {
  app.post('/requestVerification/:did', bodyParser.json(), (req, res) => {
    const { did } = req.params
    const { emailAddress } = req.body

    const verificationCode = emailVCIssuerInterface.requestVerificationFor(did, emailAddress)

    sendVerificationCode(emailAddress, verificationCode)

    res.status(200).send()
  })

  app.post('/verify/:did', bodyParser.json(), async (req, res) => {
    const { did } = req.params
    const { sig } = req.body

    try {
      const jwt = await emailVCIssuerInterface.verify(did, sig)
      res.status(200).send({ jwt })
    } catch (e) {
      res.status(500).send(escape(e.message))
    }
  })
}
