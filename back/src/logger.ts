import { loggerFactory } from '@rsksmart/rif-node-utils'

export const createLogger = (env: string, infoFile: string, errorFile: string) => loggerFactory({ env, infoFile, errorFile })('email-vc-issuer')
