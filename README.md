<p align="middle">
    <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>email-vc-issuer</code></h3>
<p align="middle">
    Email Verifiable Credential issuer.
</p>

This service allows the controller of a decentralized identity to verify your email address.

## Usage

1. User sends `POST /requestVerification/:did { emailAddress }`
2. Service sends email to `emailAddress` with a `verificationCode`
3. User opens mailbox, copies verification code, signs message including the verification code and sends `POST /verify/:did { sig }`
4. Services recovers signer address from `sig`, and compares `verificationCode` to the sent code. If matches, issues an [Email Verifiable Credential](https://github.com/rsksmart/vc-json-schemas/tree/main/schema/EmailCredentialSchema/v1.0)

## Try it

You can run the service locally with a dummy email sender

```
npm i
npm run serve:test
```

When email verification is requested the email is opened using the link logged in the terminal. It does not send real emails.

## Usage

To use it you can set up the Verifiable Credential issuer and a decoration for the verification code. Create a script in `./back/scripts` folder as follows

```typescript
import EthrDID from '@rsksmart/ethr-did'
import EmailVCIssuerInterface from '../model/EmailVCIssuerInterface'
import { setupService } from '../api'

const app = express()

// setup your app: cors, authentication, etc.

// create the issuer - do not use this keys for production
export const issuer =  new EthrDID({
  address: '0x7009cdcbe41dd62dd7e6ccfd8b76893207fbba68',
  privateKey: '3b9c8ea990c87091eca8ed8e82edf73c6b1c37fe7640e95460cedff09bdf21ff',
  method: 'ethr:rsk'
})

// create a decoration for the verification code in their wallet
// user should sign the decorated message - this improves user experience
const decorateVerificationCode = (code: string) => `Verification code: ${code}`

// create the interface
const emailVCIssuerInterface = new EmailVCIssuerInterface(issuer, decorateVerificationCode)

async function sendVerificationCode(to: string, text: string) {
    // your email sender
}

// setup the service api
setupService(app, {
  emailVCIssuerInterface,
  sendVerificationCode
})

// run!
app.listen(3500)
```

## Front-end

In `./front` folder you can find a sample front-end that operates with Metamask wallet to sign the required messages.
