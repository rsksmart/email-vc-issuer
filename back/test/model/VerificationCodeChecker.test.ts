import VerificationCodeChecker, { CODE_NOT_GENERATED_ERROR_MESSAGE } from '../../src/model/VerificationCodeChecker'
import { did, anotherDid } from '../mocks'
import MockDate from 'mockdate'
import DidCode from '../../src/model/entities/did-code'
import { Connection, Repository } from 'typeorm'
import { createSqliteConnection, resetDatabase, deleteDatabase } from '../utils'

describe('VerificationCodeChecker', function(this: {
  checker: VerificationCodeChecker
  dbConnection: Connection
  repository: Repository<DidCode>
}) {
  const database = './email-vc-issuer-code-checker.test.sqlite'

  beforeAll(async () => {
    this.dbConnection = await createSqliteConnection(database)
  })

  beforeEach(async () => {
    await resetDatabase(this.dbConnection)
    this.repository = this.dbConnection.getRepository(DidCode)
    this.checker = new VerificationCodeChecker(this.repository)
  })

  afterAll(() => deleteDatabase(this.dbConnection, database))

  test('checks the code is correct', async () => {
    const code = await this.checker.generateCodeFor(did)

    expect(await this.checker.getCodeOf(did)).toEqual(code)
  })

  test('resets code for the same did', async () => {
    const code = await this.checker.generateCodeFor(did)
    const secondCode = await this.checker.generateCodeFor(did)

    expect(code).not.toEqual(secondCode)
    expect(await this.checker.getCodeOf(did)).toEqual(secondCode)
  })

  test('sends different codes for the different dids', async () => {
    const code = await this.checker.generateCodeFor(did)
    const anotherCode = await this.checker.generateCodeFor(anotherDid)

    expect(code).not.toEqual(anotherCode)
    expect(await this.checker.getCodeOf(did)).toEqual(code)
    expect(await this.checker.getCodeOf(anotherDid)).toEqual(anotherCode)
  })

  test('does not answer code when not generated', async () => {
    expect(() => this.checker.getCodeOf(did)).rejects.toThrowError(CODE_NOT_GENERATED_ERROR_MESSAGE)
  })

  test('mark code as invalid after 10 minutes', async () => {
    const code = await this.checker.generateCodeFor(did)

    expect(await this.checker.getCodeOf(did)).toEqual(code)

    MockDate.set(Date.now() + 600000 + 100)
    expect(() => this.checker.getCodeOf(did)).rejects.toThrowError(CODE_NOT_GENERATED_ERROR_MESSAGE)
  })

  test('saves the code in the db', async () => {
    const code = await this.checker.generateCodeFor(did)

    const record = await this.repository.findOne({ where: { did }})

    expect(record!.code).toEqual(code)
  })
})
