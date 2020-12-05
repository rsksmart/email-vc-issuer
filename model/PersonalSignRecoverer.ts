import { fromRpcSig, hashPersonalMessage, ecrecover, pubToAddress } from 'ethereumjs-util'

export default class {
  recover(msg: string, sig: string) {
    const { v, r, s } = fromRpcSig(sig)
    const msgHash = hashPersonalMessage(Buffer.from(msg))
    return `0x${pubToAddress(ecrecover(msgHash, v, r, s)).toString('hex')}`
  }
}
