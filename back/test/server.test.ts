import request from 'supertest'
import { createApp, whitelist } from '../src/server'

describe('server', function (this: {
  app: Express.Application
}) {
  beforeAll(() => {
    this.app = createApp()
  })

  test('bad origin', async () => {
    const response = await request(this.app).get('/__health').set('Origin', 'https://badorigin.com').send()
    expect(response.status).toEqual(500)
    expect(response.text).toContain('Not allowed by CORS')
  })

  describe('whitelist', () => {
    for (let origin of whitelist) {
      test(origin, async () => {
        const response = await request(this.app).get('/__health').set('Origin', origin).send()
        expect(response.status).toEqual(200)
        expect(response.text).toEqual('OK')
      })
    }
  })
})
