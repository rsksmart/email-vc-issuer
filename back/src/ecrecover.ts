import { fromRpcSig, hashPersonalMessage, ecrecover as _ecrecover, pubToAddress } from 'ethereumjs-util'

export const ecrecover = (msg: string, sig: string) => {
  const { v, r, s } = fromRpcSig(sig)
  const msgHash = hashPersonalMessage(Buffer.from(msg))
  return `0x${pubToAddress(_ecrecover(msgHash, v, r, s)).toString('hex')}`
}
