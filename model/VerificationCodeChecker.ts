import { randomBytes }  from 'crypto'

export default class VerificationCodeChecker {
  codes: Map<string, string>

  constructor() {
    this.codes = new Map()
  }

  getCodeFor(did: string) {
    const code = randomBytes(32).toString('hex')
    this.codes.set(did, code)
    return code
  }

  checkCodeFor(did: string, code: string) {
    return code === this.codes.get(did)
  }
}
