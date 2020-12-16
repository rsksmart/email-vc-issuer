import React, { useState } from 'react'
import RLogin from '@rsksmart/rlogin'
import WalletConnectProvider from '@walletconnect/web3-provider'
import DataVaultWebClient from '@rsksmart/ipfs-cpinner-client'
import Nav from './Nav'

const backUrl = 'https://email-vc-issuer.staging.rifcomputing.net'

declare global {
  interface Window {
    ethereum: {
      enable: () => Promise<string[]>
    }
  }
}

interface Web3Provider {
  request: (args: { method: string, params?: any[] }) => Promise<any>
}

export const rLogin = new RLogin({
  cachedProvider: false,
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        rpc: {
          1: 'https://mainnet.infura.io/v3/8043bb2cf99347b1bfadfb233c5325c0',
          30: 'https://public-node.rsk.co',
          31: 'https://public-node.testnet.rsk.co'
        }
      }
    }
  },
  supportedChains: [31]
})

const handleInputChangeFactory = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value)
const accountToDid = (account: string) => `did:ethr:rsk:testnet:${account}`

function App() {
  const [error, setError] = useState('')
  const [provider, setProvider] = useState<Web3Provider | null>(null)
  const [dataVault, setDataVault] = useState<DataVaultWebClient | null>(null)
  const [account, setAccount] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [wasEmailSent, setWasEmailSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [jwt, setJwt] = useState('')
  const [savedInDataVault, setSavedInDataVault] = useState(false)

  const did = !!account ? accountToDid(account) : ''

  const handleError = (error: Error) => setError(error ? error.message : 'Unhandled error')

  const enable = () => rLogin.connect()
    .then((provider: Web3Provider) => {
      setProvider(provider)

      provider.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        setAccount(accounts[0])
        const did = accountToDid(accounts[0])

        console.log(did)

        const dataVault = new DataVaultWebClient({
          serviceUrl: 'https://identity.staging.rifcomputing.net',
          serviceDid: 'did:ethr:rsk:testnet:0x285B30492a3F444d78f75261A35cB292Fc8F41A6',
          did,
          rpcPersonalSign: (data: string) => provider!.request({ method: 'personal_sign', params: [accounts[0], data] })
        })

        setDataVault(dataVault)
      })
    })
    .catch(handleError)

  const requestVerification = () => fetch(`${backUrl}/requestVerification/` + did, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify({ emailAddress })
  }).then(() => {
    setWasEmailSent(true)
  }).catch(handleError)

  const verify = () => provider!.request({
    method: 'personal_sign',
    params: [
      account,
      `Verification code: ${verificationCode}` // includes the decoration
    ]
  }).then((sig: string) => fetch(`${backUrl}/verify/` + did, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify({ sig })
  }))
    .then(res => res.json())
    .then(({ jwt }: { jwt: string }) => { setJwt(jwt) })
    .catch(handleError)

  const saveInDataVault = () => dataVault!.create({ key: 'EmailVerifiableCredential', content: jwt })
    .then(() => {
      setSavedInDataVault(true)
    })
    .catch(handleError)


  return <div>
    <Nav />
    <div className="container">
      <div className="row">
        <div className="col">
          <h1>Email VC Issuer</h1>

          {error && <p>Error: {error}</p>}

          <h3>1. Enable wallet</h3>
          <button onClick={enable} className="btn btn-primary">enable</button>
          <p>{account}</p>
          <p>{did}</p> {/* fix network according wallet */}

          <h3>2. Request email verification</h3>
          <div className="input-group">
            <input type="email" value={emailAddress} onChange={handleInputChangeFactory(setEmailAddress)} disabled={!account} placeholder="Email address" className="form-control" />
            <div className="input-group-append">
              <button id="request" onClick={requestVerification} disabled={!account} className="btn btn-primary">request</button>
            </div>
          </div>
          <p>{wasEmailSent && 'Email sent'}</p>

          <h3>3. Verify your email</h3>
          <div className="input-group">
            <input type="text" value={verificationCode} onChange={handleInputChangeFactory(setVerificationCode)} disabled={!wasEmailSent} placeholder="Verification code" className="form-control" />
            <div className="input-group-append">
              <button onClick={verify} disabled={!wasEmailSent} className="btn btn-primary">verify</button>
            </div>
          </div>
          <p style={{ wordWrap: 'break-word' }}>{jwt}</p>

          <h3>4. Store it in your Data Vault</h3>
          <button onClick={saveInDataVault} disabled={!jwt} className="btn btn-primary">save</button>
          <p style={{ wordWrap: 'break-word' }}>{savedInDataVault && 'Saved!'}</p>

          <h3>5. Validate in RIF Id Manager</h3>
          <p>Go to the <a href="https://rsksmart.github.io/rif-identity-manager/" target="_blank" rel="noreferrer">RIF Identity Manager</a></p>
        </div>
      </div>
    </div>
  </div>
}

export default App;
