import { randomBytes }  from 'crypto'

export const CODE_NOT_GENERATED_ERROR_MESSAGE = 'Generate code first'

export default class VerificationCodeChecker {
  codes: Map<string, string>

  constructor() {
    this.codes = new Map()
  }

  generateCodeFor(did: string) {
    const code = randomBytes(32).toString('hex')
    this.codes.set(did, code)
    return code
  }

  getCodeOf(did: string) {
    const code = this.codes.get(did)
    if (!code) throw new Error(CODE_NOT_GENERATED_ERROR_MESSAGE)
    return code
  }
}
