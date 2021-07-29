import request from 'supertest'
import { createApp } from '../src/server'

describe('server', () => {
  test('health check', async () => {
    const app = createApp()
    const response = await request(app).get('/__health').send()
    expect(response.status).toEqual(200)
    expect(response.text).toEqual('OK')
  })
})
