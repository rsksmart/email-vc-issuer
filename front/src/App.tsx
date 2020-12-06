import React, { useState } from 'react'
import Nav from './Nav'

const backUrl = 'http://localhost:3500'

declare global {
  interface Window {
    ethereum: {
      enable: () => Promise<string[]>
      request: (args: any) => Promise<any>
    }
  }
}

const handleInputChangeFactory = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value)

function App() {
  const [error, setError] = useState('')
  const [account, setAccount] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [wasEmailSent, setWasEmailSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [jwt, setJwt] = useState('')

  const did = !!account ? `did:ethr:rsk:${account}` : ''

  const handleError = (error: Error) => setError(error.message)

  const enable = () => window.ethereum.enable()
    .then((accounts: string[]) => { setAccount(accounts[0]) })
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

  const verify = () => window.ethereum.request({
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


  return <>
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
        </div>
      </div>
    </div>
  </>
}

export default App;
