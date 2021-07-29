import { decorateVerificationCode, VerificationRequest } from './verificationRequest'
import { ecrecover } from './ecrecover'
import { getAccountFromDID } from './did'
import { IssuedVC } from './vc'
import { createVerifiableCredentialJwt } from 'did-jwt-vc'
import { Connection, VerificationRequests, IssuedVCs, Issuer, DecorateVerificationCode, CredentialTemplate, IVCIssuer } from './types'

export class VCIssuer implements IVCIssuer {
  issuer: Issuer
  issuedVCs: IssuedVCs
  verificationRequests: VerificationRequests
  public credentialType: string
  credentialTemplate: CredentialTemplate

  constructor(
    issuer: Issuer,
    connection: Connection,
    credentialType: string,
    credentialTemplate: CredentialTemplate,
  ) {
    this.credentialType = credentialType
    this.credentialTemplate = credentialTemplate
    this.issuer = issuer
    this.issuedVCs = connection.getRepository(IssuedVC)
    this.verificationRequests = connection.getRepository(VerificationRequest)
  }

  private async createRequest(did: string, request: string) {
    const verificationRequest = new VerificationRequest(did, this.credentialType, request)
    await this.verificationRequests.save(verificationRequest)
    return verificationRequest
  }

  private async getRequest(did: string) {
    const verificationRequest = await this.verificationRequests.findOne({ where: { did, type: this.credentialType } })
    if (!verificationRequest) throw new Error('Request not found')
    return verificationRequest
  }

  private verifySignature(did: string, code: string, sig: string) {
    const msg = decorateVerificationCode(code)
    const signer = ecrecover(msg, sig)
    if (getAccountFromDID(did) !== signer.toLowerCase()) throw new Error('Invalid signature')
  }

  private async findIssuedVC(did: string, subject: string) {
    const issuedVC = await this.issuedVCs.findOne({
      where: { did, type: this.credentialType, subject },
      select: ['jwt']
    })

    if (issuedVC) return issuedVC
  }

  private async createVC(did: string, subject: string) {
    const payload = this.credentialTemplate(did, subject)
    const jwt = await createVerifiableCredentialJwt(payload, this.issuer)
    return jwt
  }

  private async saveVC(did: string, subject: string, jwt: string) {
    const newIssuedVC = new IssuedVC(did, this.credentialType, subject, jwt)
    await this.issuedVCs.save(newIssuedVC)
  }

  async requestVerification(did: string, request: string) {
    const verificationRequest = await this.createRequest(did, request)
    return verificationRequest.code
  }

  async verify(did: string, sig: string) {
    const verificationRequest = await this.getRequest(did)
    if (verificationRequest.hasExpired()) throw new Error('Request has expired')

    const { code, subject } = verificationRequest

    this.verifySignature(did, code, sig)

    const issuedVC = await this.findIssuedVC(did, subject)
    if (issuedVC) return issuedVC.jwt

    const jwt = await this.createVC(did, subject)
    await this.saveVC(did, subject, jwt)

    return jwt
  }
}
