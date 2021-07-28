import dotenv from 'dotenv'

export const setupConfig = () => {
    dotenv.config()

    if (!process.env.PRIVATE_KEY) throw new Error('Please configure a private key')

    return {
        // issuer
        PRIVATE_KEY: process.env.PRIVATE_KEY,
        NETWORK_NAME: process.env.NETWORK_NAME || 'rsk',
        // server
        PORT: process.env.PORT || 5108,
        // logging
        NODE_ENV: process.env.NODE_ENV || 'dev',
        LOG_FILE: process.env.LOG_FILE || './log/email-vc-issuer.log',
        LOG_ERROR_FILE: process.env.LOG_ERROR_FILE || './log/email-vc-issuer.log',
        // email verifications
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
        // twilo
        TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
        TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
        TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER
    }
}
