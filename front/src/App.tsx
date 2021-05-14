import React, { useState } from 'react'
import RLogin from '@rsksmart/rlogin'
import WalletConnectProvider from '@walletconnect/web3-provider'
import Portis from '@portis/web3'
import DataVaultWebClient, { AuthManager, AsymmetricEncryptionManager, SignerEncryptionManager } from '@rsksmart/ipfs-cpinner-client'
import Nav from './Nav'
import { createDidFormat } from '@rsksmart/did-utils'

const backUrl = process.env.REACT_APP_BACK_END_URL

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
    },
    portis: {
      package: Portis,
      options: {
        id: 'bb40ce05-67d3-48d0-85ca-92536952f38e',
        network: {
          nodeUrl: 'https://public-node.testnet.rsk.co',
          chainId: 30
        }
      }
    }
  },
  supportedChains: [1, 30, 31]
})

const handleInputChangeFactory = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value)

const getEncryptionManager = async (provider: any) => {
  if (provider.isMetaMask && !provider.isNiftyWallet) return await AsymmetricEncryptionManager.fromWeb3Provider(provider)
  return await SignerEncryptionManager.fromWeb3Provider(provider)
}

function App() {
  const [error, setError] = useState('')
  const [provider, setProvider] = useState<Web3Provider | null>(null)
  const [account, setAccount] = useState('')
  const [chainId, setChainId] = useState(0)
  const [emailAddress, setEmailAddress] = useState('')
  const [wasEmailSent, setWasEmailSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [jwt, setJwt] = useState('')
  const [savedInDataVault, setSavedInDataVault] = useState(false)

  const did = !!account ? createDidFormat(account, chainId) : ''

  const handleError = (error: Error) => setError(error ? error.message : 'Unhandled error')

  const enable = () => rLogin.connect()
    .then(({ provider }: any) => {
      setProvider(provider)

      Promise.all([
        provider.request({ method: 'eth_accounts' }),
        provider.request({ method: 'eth_chainId'})
      ]).then(([accounts, chainId]) => {
        setAccount(accounts[0])
        setChainId(Number(chainId))
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
      `Verification code: ${verificationCode}`, // includes the decoration
      account
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
    .then(res => {
      res.status === 200
        ? res.json().then(({ jwt }: { jwt: string }) => { setJwt(jwt) })
        : res.text().then((error: string) => handleError(new Error(error)))
    })
    .catch(handleError)

  const serviceUrl = 'https://data-vault.identity.rifos.org'

  const saveInDataVault = () => getEncryptionManager(provider).then((encryptionManager) => new DataVaultWebClient({
    authManager: new AuthManager({
      did,
      serviceUrl,
      personalSign: (data: string) => provider!.request({ method: 'personal_sign', params: [data, account] })
    }),
    encryptionManager,
    serviceUrl
  }).create({ key: 'EmailVerifiableCredential', content: jwt })
    .then(() => {
      setSavedInDataVault(true)
    })
  ).catch(handleError)


  return <div>
    <Nav />
    <div className="container">
      <div className="row">
        <div className="col">
          <h1>Email VC Issuer</h1>

          {error && <p className="error">Error: {error}</p>}

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
          <p>Go to the <a href="https://identity.rifos.org/" target="_blank" rel="noreferrer">RIF Identity Manager</a></p>
        </div>
      </div>
    </div>
  </div>
}

export default App;
