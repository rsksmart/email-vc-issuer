import VerificationCodeChecker, { CODE_NOT_GENERATED_ERROR_MESSAGE } from '../../src/model/VerificationCodeChecker'
import { did, anotherDid } from '../mocks'

describe('VerificationCodeChecker', function(this: {
  checker: VerificationCodeChecker
}) {
  beforeEach(() => {
    this.checker = new VerificationCodeChecker()
  })
  test('checks the code is correct', () => {
    const code = this.checker.generateCodeFor(did)

    expect(this.checker.getCodeOf(did)).toEqual(code)
  })

  test('resets code for the same did', () => {
    const code = this.checker.generateCodeFor(did)
    const secondCode = this.checker.generateCodeFor(did)

    expect(code).not.toEqual(secondCode)
    expect(this.checker.getCodeOf(did)).toEqual(secondCode)
  })

  test('sends different codes for the different dids', () => {
    const code = this.checker.generateCodeFor(did)
    const anotherCode = this.checker.generateCodeFor(anotherDid)

    expect(code).not.toEqual(anotherCode)
    expect(this.checker.getCodeOf(did)).toEqual(code)
    expect(this.checker.getCodeOf(anotherDid)).toEqual(anotherCode)
  })

  test('does not answer code when not generated', () => {
    expect(() => this.checker.getCodeOf(did)).toThrowError(CODE_NOT_GENERATED_ERROR_MESSAGE)
  })
})
