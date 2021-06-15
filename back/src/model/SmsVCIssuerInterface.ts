import { Issuer } from 'did-jwt-vc'
import VerificationCodeChecker from './VerificationCodeChecker'
import PersonalSignRecoverer from './PersonalSignRecoverer'
import SmsVCIssuer from './SmsVCIssuer'
import IssuedSmsVC from './entities/issued-vc-sms'
import { Connection } from 'typeorm'
import DidChallenge from './entities/did-code'

export type DecorateVerificationCode = (verificationCode: string) => string

export const INVALID_SIGNATURE_ERROR_MESSAGE = 'Invalid signature'

export default class {
  verificationCodeChecker: VerificationCodeChecker
  personalSignRecoverer: PersonalSignRecoverer
  smsVCIssuer: SmsVCIssuer
  decorateVerificationCode: DecorateVerificationCode
  lastSmsRequest: Map<string, string>

  constructor(issuer: Issuer, dbConnection: Connection, decorateVerificationCode: DecorateVerificationCode) {
    this.verificationCodeChecker = new VerificationCodeChecker(dbConnection.getRepository(DidChallenge))
    this.personalSignRecoverer = new PersonalSignRecoverer()
    this.smsVCIssuer = new SmsVCIssuer(issuer, dbConnection.getRepository(IssuedSmsVC))
    this.decorateVerificationCode = decorateVerificationCode
    this.lastSmsRequest = new Map()
  }

  requestVerificationFor(did: string, phoneNumber: string) {
    this.lastSmsRequest.set(did, phoneNumber)
    return this.verificationCodeChecker.generateCodeFor(did, 3)
  }

  async verify(did: string, sig: string) {
    const verificationCode = await this.verificationCodeChecker.getCodeOf(did)
    const msg = this.decorateVerificationCode(verificationCode)
    const signer = this.personalSignRecoverer.recover(msg, sig)
    if (did.split(':').slice(-1)[0].toLowerCase() !== signer.toLowerCase()) throw new Error(INVALID_SIGNATURE_ERROR_MESSAGE)
    return this.smsVCIssuer.createVerifiableCredentialFor(did, this.lastSmsRequest.get(did)!)
  }
}
