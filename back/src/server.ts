import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'

export const createApp = () => {
  const app = express()
  app.use(cors())

  const limiter = rateLimit({
    windowMs: 1000, // 1 minute
    max: 5
  });

  app.use(limiter);

  app.get('/__health', (req, res) => {
    res.status(200).end('OK')
  })

  return app
}
