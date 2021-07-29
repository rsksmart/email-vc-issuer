import { ecsign, hashPersonalMessage, toRpcSig } from 'ethereumjs-util'

export const rpcPersonalSign = (msg: string, privateKey: Buffer) => {
  const msgHash = hashPersonalMessage(Buffer.from(msg))
  const { v, r, s } = ecsign(msgHash, privateKey)
  return toRpcSig(v, r, s)
}
