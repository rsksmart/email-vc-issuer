import { loggerFactory } from '@rsksmart/rif-node-utils'
import { Logger } from '@rsksmart/rif-node-utils/lib/logger'

export const createLogger: (env: string, infoFile: string, errorFile: string) => Logger = (env, infoFile, errorFile) => loggerFactory({ env, infoFile, errorFile })('email-vc-issuer')
