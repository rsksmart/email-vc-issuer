import { randomBytes }  from 'crypto'
import { Repository } from 'typeorm'
import DidCode from './entities/did-code'

export const CODE_NOT_GENERATED_ERROR_MESSAGE = 'Generate code first'

export default class VerificationCodeChecker {
  constructor(private repository: Repository<DidCode>) { }

  async generateCodeFor(did: string) {
    const code = randomBytes(32).toString('hex')
    const newRecord = new DidCode(did, code)

    return this.repository.findOne({ where: { did} })
      .then(record => {
        if (!record) return this.repository.save(newRecord) 
        
        record.expirationTime = newRecord.expirationTime
        record.code = code
        return this.repository.save(record)
      })
      .then(() => code)
  }

  async getCodeOf(did: string) {
    const codeRecord = await this.repository.findOne({ where: { did } })

    if (!codeRecord || Date.now() > codeRecord.expirationTime) throw new Error(CODE_NOT_GENERATED_ERROR_MESSAGE)
    return codeRecord.code
  }
}
