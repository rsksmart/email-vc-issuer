type Config = {
    // issuer
    PRIVATE_KEY: string
    NETWORK_NAME: string
    // server
    PORT: number
    // logging
    NODE_ENV: string
    LOG_FILE: string
    LOG_ERROR_FILE: string
    // email verifications
    SMTP_HOST?: string
    SMTP_PORT?: string
    SMTP_USER?: string
    SMTP_PASS?: string
    // twilo
    TWILIO_AUTH_TOKEN?: string
    TWILIO_ACCOUNT_SID?: string
    TWILIO_PHONE_NUMBER?: string
}

export const setupConfig = (env: typeof process.env): Config => {
    if (!env.PRIVATE_KEY) throw new Error('Please configure a private key')

    return {
        // issuer
        PRIVATE_KEY: env.PRIVATE_KEY,
        NETWORK_NAME: env.NETWORK_NAME || 'rsk',
        // server
        PORT: Number(env.PORT) || 5108,
        // logging
        NODE_ENV: env.NODE_ENV || 'dev',
        LOG_FILE: env.LOG_FILE || './log/email-vc-issuer.log',
        LOG_ERROR_FILE: env.LOG_ERROR_FILE || './log/email-vc-issuer.log',
        // email verifications
        SMTP_HOST: env.SMTP_HOST,
        SMTP_PORT: env.SMTP_PORT,
        SMTP_USER: env.SMTP_USER,
        SMTP_PASS: env.SMTP_PASS,
        // twilo
        TWILIO_AUTH_TOKEN: env.TWILIO_AUTH_TOKEN,
        TWILIO_ACCOUNT_SID: env.TWILIO_ACCOUNT_SID,
        TWILIO_PHONE_NUMBER: env.TWILIO_PHONE_NUMBER
    }
}
