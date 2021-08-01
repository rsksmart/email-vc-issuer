import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'

export const whitelist = ['http://localhost:3000', 'https://email-verifier.identity.rifos.org', 'https://identity.rifos.org/']

const corsOptions: Parameters<typeof cors>[0] = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin!) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

export const createApp = () => {
  const app = express()
  app.use(cors(corsOptions))

  const limiter = rateLimit({
    windowMs: 1000, // 1 minute
    max: 5
  });

  // this enables cross-origin requests
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin as string)
    next()
  })

  app.use(limiter);

  app.get('/__health', (req, res) => {
    res.status(200).end('OK')
  })

  return app
}
