<p align="middle">
    <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>email-vc-issuer</code></h3>
<p align="middle">
    Email Verifiable Credential issuer.
</p>

<p align="middle">
  <a href="https://github.com/rsksmart/email-vc-issuer/actions?query=workflow%3Atest">
    <img src="https://github.com/rsksmart/email-vc-issuer/workflows/test/badge.svg" />
  </a>
  <a href="https://lgtm.com/projects/g/rsksmart/email-vc-issuer/alerts/">
    <img src="https://img.shields.io/lgtm/alerts/github/rsksmart/email-vc-issuer" alt="alerts">
  </a>
  <a href="https://lgtm.com/projects/g/rsksmart/email-vc-issuer/context:javascript">
    <img src="https://img.shields.io/lgtm/grade/javascript/github/rsksmart/email-vc-issuer">
  </a>
</p>

This service allows the controller of a decentralized identity to verify your email address.

## Try it

### Configure

Create an `.env` file under `./back` folder with the following:

```
PRIVATE_KEY=private key associated to the service. Is used to sign the email VCs
```

Optionally you can set:

```
SMTP_HOST=host of the mail server
SMTP_PORT=port of the mail server
SMTP_USER=user to log in to the mail server. Will be used to set the from of the email
SMTP_PASS=password to log in to the mail server
LOG_FILE=relative path of the log file
LOG_ERROR_FILE=relative path of the error log file
NETWORK_NAME=rsk:testnet or rsk
PORT=port where the service will be served
```

> To run in production you will have to set SMTP variables. Ethereal is a testing framework.

Default values: 

```
SMTP_HOST=dynamically created using https://ethereal.email/
SMTP_PORT=dynamically created using https://ethereal.email/
SMTP_USER=dynamically created using https://ethereal.email/
SMTP_PASS=dynamically created using https://ethereal.email/
LOG_FILE=./log/email-vc-issuer.log
LOG_ERROR_FILE=./log/email-vc-issuer.error.log
NETWORK_NAME=rsk
PORT=5108
```

Example:

```
PRIVATE_KEY=3b9c8ea990c87091eca8ed8e82edf73c6b1c37fe7640e95460cedff09bdf21ff
```

NOTE: With this `.env` config file, the email will not be sent to the given address, it will print an url in the console with the URL to preview the "sent" email

### Run it

From the root folder, run the following

```
npm i
npm run setup
npm run serve:test
```

## Backend description

1. User sends `POST /requestVerification/:did { emailAddress }`
2. Service sends email to `emailAddress` with a `verificationCode`
3. User opens mailbox, copies verification code, signs message including the verification code and sends `POST /verify/:did { sig }`
4. Services recovers signer address from `sig`, and compares `verificationCode` to the sent code. If matches, issues an [Email Verifiable Credential](https://github.com/rsksmart/vc-json-schemas/tree/main/schema/EmailCredentialSchema/v1.0)

### Run it with Docker

Create the `.env` file with the above guideline, and then run the following

```
cd back/
docker-compose build
docker-compose up -d
```

It will expose the api in the PORT described in the `.env` file

## Frontend description

React.js app integrating:
1. Choose wallet using [`rLogin`](https://github.com/rsksmart/rLogin)
2. Request email verification
3. Sign email verification with wallet of choice
4. Receive email Verifiable credential
5. Store credential in Data vault using [`rif-data-vault`](https://github.com/rsksmart/rif-data-vault)

