type Env = 'dev' | 'production'

type IssuerConfig = {
    PRIVATE_KEY: string
    NETWORK_NAME: string
}

type ServerConfig = {
    PORT: number
}

type LoggerConfig = {
    NODE_ENV: Env
    LOG_FILE: string
    LOG_ERROR_FILE: string
}

type SmtpConfig = {
    SMTP_HOST: string
    SMTP_PORT: number
    SMTP_USER: string
    SMTP_PASS: string
}

type TwilioConfig = {
    TWILIO_AUTH_TOKEN: string
    TWILIO_ACCOUNT_SID: string
    TWILIO_PHONE_NUMBER: string
}

type Services = {
    smtpConfig?: SmtpConfig
    twilioConfig?: TwilioConfig
}

export type Config = IssuerConfig & ServerConfig & LoggerConfig & Services

export const setupConfig = (env: typeof process.env): Config => {
  if (!env.PRIVATE_KEY) {
    throw new Error('Please configure a private key')
  }

  if (env.NODE_ENV && env.NODE_ENV !== 'dev' && env.NODE_ENV !== 'production') {
    throw new Error('Invalid env')
  }

  const config: Config = {
    // issuer
    PRIVATE_KEY: env.PRIVATE_KEY,
    NETWORK_NAME: env.NETWORK_NAME || 'rsk',
    // server
    PORT: Number(env.PORT) || 5108,
    // logging
    NODE_ENV: (env.NODE_ENV as Env | undefined) || 'dev',
    LOG_FILE: env.LOG_FILE || './log/email-vc-issuer.log',
    LOG_ERROR_FILE: env.LOG_ERROR_FILE || './log/email-vc-issuer.log',
  }

  if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS) {
    config.smtpConfig = {
      SMTP_HOST: env.SMTP_HOST,
      SMTP_PORT: Number(env.SMTP_PORT),
      SMTP_USER: env.SMTP_USER,
      SMTP_PASS: env.SMTP_PASS
    }
  }

  if (env.TWILIO_AUTH_TOKEN && env.TWILIO_ACCOUNT_SID && env.TWILIO_PHONE_NUMBER) {
    config.twilioConfig = {
      TWILIO_AUTH_TOKEN: env.TWILIO_AUTH_TOKEN,
      TWILIO_ACCOUNT_SID: env.TWILIO_ACCOUNT_SID,
      TWILIO_PHONE_NUMBER: env.TWILIO_PHONE_NUMBER
    }
  }

  return config
}
