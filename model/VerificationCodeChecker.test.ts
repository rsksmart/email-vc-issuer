import VerificationCodeChecker from './VerificationCodeChecker'

describe('VerificationCodeChecker', () => {
  test('checks the code is correct', () => {
    const checker = new VerificationCodeChecker()

    const did = 'did:ethr:rsk:0x87eb390df1e05ef0560e387206f5997034cd6f28'
    const code = checker.getCodeFor(did)

    expect(checker.checkCodeFor(did, 'INVALID CODE')).toBeFalsy()
    expect(checker.checkCodeFor(did, code)).toBeTruthy()
  })

  test('resets code for the same did', () => {

    const checker = new VerificationCodeChecker()

    const did = 'did:ethr:rsk:0x87eb390df1e05ef0560e387206f5997034cd6f28'
    const code = checker.getCodeFor(did)
    const secondCode = checker.getCodeFor(did)

    expect(code).not.toEqual(secondCode)
    expect(checker.checkCodeFor(did, code)).toBeFalsy()
    expect(checker.checkCodeFor(did, secondCode)).toBeTruthy()
  })

  test('sends different codes for the different dids', () => {

    const checker = new VerificationCodeChecker()

    const did = 'did:ethr:rsk:0x87eb390df1e05ef0560e387206f5997034cd6f28'
    const did2 = 'did:ethr:rsk:0xa31a90984e7aeb66929759d192793736600687bc'
    const code = checker.getCodeFor(did)
    const code2 = checker.getCodeFor(did2)

    expect(code).not.toEqual(code2)
    expect(checker.checkCodeFor(did, code2)).toBeFalsy()
    expect(checker.checkCodeFor(did2, code)).toBeFalsy()
  })
})
