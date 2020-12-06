import { Resolver } from 'did-resolver'
import { getResolver } from 'ethr-did-resolver'
import EthrDID from '@rsksmart/ethr-did'

export const createIssuer = () => new EthrDID({
  address: '0x7009cdcbe41dd62dd7e6ccfd8b76893207fbba68',
  privateKey: '3b9c8ea990c87091eca8ed8e82edf73c6b1c37fe7640e95460cedff09bdf21ff',
  method: 'ethr:rsk'
})

export const createResolver = () => new Resolver(getResolver({
  networks: [
    { name: 'rsk', registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b", rpcUrl: "https://did.rsk.co:4444" }
  ]
}))
