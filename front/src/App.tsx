import React, { useState } from 'react'
import RLogin from '@rsksmart/rlogin'
import WalletConnectProvider from '@walletconnect/web3-provider'
import Portis from '@portis/web3'
import { ledgerProviderOptions } from '@rsksmart/rlogin-ledger-provider'
import DataVaultWebClient, { AuthManager, AsymmetricEncryptionManager, SignerEncryptionManager } from '@rsksmart/ipfs-cpinner-client'
import Nav from './Nav'
import { createDidFormat } from '@rsksmart/did-utils'

const backUrl = process.env.REACT_APP_BACK_END_URL

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
          chainId: 31
        }
      }
    },
    'custom-ledger': {
      ...ledgerProviderOptions,
      options: {
        rpcUrl: 'https://public-node.testnet.rsk.co',
        chainId: 31
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

enum CredentialType {
  none = '',
  email = 'email',
  phone = 'phone'
}

const getKeyByCredentialType = (module: CredentialType) => {
  if (module === CredentialType.email) {
    return 'EmailVerifiableCredential'
  }

  if (module === CredentialType.phone) {
    return 'PhoneVerifiableCredential'
  }

  throw new Error('Undefined module')
}

function App() {
  const [error, setError] = useState('')
  const [provider, setProvider] = useState<Web3Provider | null>(null)
  const [account, setAccount] = useState('')
  const [chainId, setChainId] = useState(0)
  const [credentialType, setCredentialType] = useState(CredentialType.none)
  const [subject, setSubject] = useState('')
  const [wasEmailSent, setWasEmailSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [jwt, setJwt] = useState('')
  const [savedInDataVault, setSavedInDataVault] = useState(false)

  const did = !!account ? createDidFormat(account, chainId) : ''

  const handleError = (error: Error) => setError(error ? error.message : 'Unhandled error')

  const enable = () => rLogin.connect()
    .then(({ provider, disconnect }: any) => {
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

  const requestVerification = () => fetch(`${backUrl}/${credentialType}/requestVerification/` + did, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify({ subject: subject })
  }).then(() => {
    setWasEmailSent(true)
  }).catch(handleError)

  const verify = () => provider!.request({
    method: 'personal_sign',
    params: [
      `Verification code: ${verificationCode}`, // includes the decoration
      account
    ]
  }).then((sig: string) => fetch(`${backUrl}/${credentialType}/verify/` + did, {
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
  }).create({ key: getKeyByCredentialType(credentialType), content: jwt })
    .then(() => {
      setSavedInDataVault(true)
    })
  ).catch(handleError)

  return <div>
    <Nav />
    <div className="container">
      <div className="row">
        <div className="col">
          <h1>VC Issuer</h1>

          {error && <p className="error">Error: {error}</p>}

          <h3>1. Enable wallet</h3>
          <p>Connect your wallet to the site to start the verification.</p>
          <button onClick={enable} disabled={account !== ''} className="btn btn-primary">enable</button>
          <p>{account}</p>
          <p>{did}</p> {/* fix network according wallet */}

          <h3>2. Request verification</h3>
          <p>Choose the asset you want to verify. A verification code will be sent to it.</p>
          <select className="form-control" value={credentialType} disabled={!account || wasEmailSent} onChange={(event) => setCredentialType(event.target.value as CredentialType)}>
            <option value={CredentialType.none} disabled hidden>
              Select an Option
            </option>
            <option value={CredentialType.email}>Email</option>
            <option value={CredentialType.phone}>Phone</option>
          </select>
          <div className="input-group">
            <input type="email"
              value={subject}
              onChange={handleInputChangeFactory(setSubject)}
              disabled={!account || credentialType === CredentialType.none || wasEmailSent}
              placeholder={credentialType && `Enter your ${credentialType}`} className="form-control" />
            <div className="input-group-append">
              <button id="request" onClick={requestVerification} disabled={!subject || wasEmailSent} className="btn btn-primary">request</button>
            </div>
          </div>
          <p>{wasEmailSent && 'Email sent'}</p>

          <h3>3. Verify</h3>
          <p>Copy the verification code received and paste it here.</p>
          <div className="input-group">
            <input type="text"
              value={verificationCode}
              onChange={handleInputChangeFactory(setVerificationCode)}
              disabled={!wasEmailSent}
              placeholder="Verification code"
              className="form-control" />
            <div className="input-group-append">
              <button onClick={verify} disabled={!wasEmailSent} className="btn btn-primary">verify</button>
            </div>
          </div>
          <p style={{ wordWrap: 'break-word' }}>{jwt}</p>

          <h3>4. Save</h3>
          <p>You can now save your credential into your RIF Data Vault. This step will require you to sign different messages in your wallet.</p>
          <button onClick={saveInDataVault} disabled={!jwt} className="btn btn-primary">save</button>
          <p style={{ wordWrap: 'break-word' }}>{savedInDataVault && 'Saved!'}</p>

          <h3>5. Present credential</h3>
          <p>
            Go to the <a href="https://identity.rifos.org/" target="_blank" rel="noreferrer">RIF Identity Manager</a>&nbsp;
            to present your credential. Find it under 'Data Vault' tab.
          </p>
        </div>
      </div>
    </div>
  </div>
}

export default App;
