import React, { useState } from 'react';

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


  return (
    <div>
      <h1>Email VC Issuer</h1>

      {error && <p>Error: {error}</p>}

      <h3>1. Enable wallet</h3>
      <button onClick={enable}>enable</button>
      <p>{account}</p>
      <p>{did}</p> {/* fix network according wallet */}

      <h3>2. Request email verification</h3>
      <input type="email" value={emailAddress} onChange={handleInputChangeFactory(setEmailAddress)} disabled={!account} />
      <button id="request" onClick={requestVerification} disabled={!account}>request</button>
      <p id="result"></p>

      <h3>3. Verify your email</h3>
      <input type="text" value={verificationCode} onChange={handleInputChangeFactory(setVerificationCode)} disabled={!wasEmailSent} />
      <button onClick={verify} disabled={!wasEmailSent}>verify</button>

      <p>{jwt}</p>
    </div>
  );
}

export default App;
