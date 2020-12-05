import PersonalSignRecoverer from './PersonalSignRecoverer'

describe('PersonalSignRecoverer', () => {
  test('recovers the address from hex personal_sign', () => {
    const recoverer = new PersonalSignRecoverer()

    const message = 'Hello PersonalSignRecoverer'
    const sig = '0x67f8a1e8e52a8401c7bf21161637b381f564a424b615bc741575518f3df051dc4d5715fb63d4ff3ba550de7cd8af43308c47ba561e504eb546e569cbdebc31891b'
    const address = '0x945b59d5a86e2c7d51f961f4987e8b0cad4a4f57'

    expect(recoverer.recover(message, sig)).toEqual(address)
  })
})
