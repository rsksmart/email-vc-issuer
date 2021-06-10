import { randomBytes }  from 'crypto'
import { Repository } from 'typeorm'
import DidCode from './entities/did-code'

export const CODE_NOT_GENERATED_ERROR_MESSAGE = 'Generate code first'

export default class VerificationCodeChecker {
  constructor(private repository: Repository<DidCode>) { }

  async generateCodeFor(did: string, codeSize: number = 32) {
    const code = randomBytes(codeSize).toString('hex')
    await this.repository.save(new DidCode(did, code))
    return code
  }

  async getCodeOf(did: string) {
    const codeRecord = await this.repository.findOne({ where: { did } })

    if (!codeRecord || Date.now() > codeRecord.expirationTime) throw new Error(CODE_NOT_GENERATED_ERROR_MESSAGE)
    return codeRecord.code
  }
}
