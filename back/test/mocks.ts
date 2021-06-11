import { Resolver } from 'did-resolver'
import { getResolver } from 'ethr-did-resolver'
import { rskTestnetDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'

export const privateKey = Buffer.from('876d78e89797cf2cf9441e4d0d111589cd8b36a20485d4073d03193e2f3d4861', 'hex')
export const did = 'did:ethr:rsk:0x87eb390df1e05ef0560e387206f5997034cd6f28'
export const emailAddress = 'test@sample.com'

export const phoneNumber = '+918802208803'

export const anotherDid = 'did:ethr:rsk:0xa31a90984e7aeb66929759d192793736600687bc'

export const anotherPrivateKey = Buffer.from('8586abcdf499527f33d4f4ecdd8c785066d095ce75b43e44326a0612914fb57e', 'hex')

export const decorateVerificationCode = (code: string) => `Verification code: ${code}`

export const issuer = rskTestnetDIDFromPrivateKey()('3b9c8ea990c87091eca8ed8e82edf73c6b1c37fe7640e95460cedff09bdf21ff')

export const resolver = new Resolver(getResolver({
  networks: [
    { name: 'rsk:testnet', registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b', rpcUrl: 'https://did.rsk.co:4444' }
  ]
}))
