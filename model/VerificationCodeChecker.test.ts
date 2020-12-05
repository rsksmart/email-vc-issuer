import VerificationCodeChecker, { CODE_NOT_GENERATED_ERROR_MESSAGE } from './VerificationCodeChecker'

describe('VerificationCodeChecker', () => {
  test('checks the code is correct', () => {
    const checker = new VerificationCodeChecker()

    const did = 'did:ethr:rsk:0x87eb390df1e05ef0560e387206f5997034cd6f28'
    const code = checker.generateCodeFor(did)

    expect(checker.getCodeOf(did)).toEqual(code)
  })

  test('resets code for the same did', () => {
    const checker = new VerificationCodeChecker()

    const did = 'did:ethr:rsk:0x87eb390df1e05ef0560e387206f5997034cd6f28'
    const code = checker.generateCodeFor(did)
    const secondCode = checker.generateCodeFor(did)

    expect(code).not.toEqual(secondCode)
    expect(checker.getCodeOf(did)).toEqual(secondCode)
  })

  test('sends different codes for the different dids', () => {
    const checker = new VerificationCodeChecker()

    const did = 'did:ethr:rsk:0x87eb390df1e05ef0560e387206f5997034cd6f28'
    const did2 = 'did:ethr:rsk:0xa31a90984e7aeb66929759d192793736600687bc'
    const code = checker.generateCodeFor(did)
    const code2 = checker.generateCodeFor(did2)

    expect(code).not.toEqual(code2)
    expect(checker.getCodeOf(did)).toEqual(code)
    expect(checker.getCodeOf(did2)).toEqual(code2)
  })

  test('does not answer code when not generated', () => {
    const checker = new VerificationCodeChecker()

    const did = 'did:ethr:rsk:0x87eb390df1e05ef0560e387206f5997034cd6f28'

    expect(() => checker.getCodeOf(did)).toThrowError(CODE_NOT_GENERATED_ERROR_MESSAGE)
  })
})
