import { Issuer, JwtCredentialPayload } from 'did-jwt-vc'
import { VerificationRequest } from './verificationRequest'
import { IssuedVC } from './vc'
import { Repository, Connection } from 'typeorm'

export type VerificationRequests = Repository<VerificationRequest>
export type IssuedVCs = Repository<IssuedVC>

export type CredentialTemplate =  (did: string, subject: string) => JwtCredentialPayload

export type DecorateVerificationCode = (verificationCode: string) => string

export type SendVerificationCode = (to: string, text: string) => Promise<void>

export interface IVCIssuer {
  credentialType: string
  requestVerification(did: string, request: string): Promise<string>
  verify(did: string, sig: string): Promise<string>
}

export { Issuer, Connection }
