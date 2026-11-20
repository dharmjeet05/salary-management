import type { Server } from 'node:http'
import express from 'express'
import { describe, expect, it } from 'vitest'
import { startServer, stopServer } from './start-server'

function portOf(server: Server) {
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('Expected a TCP address')
  return address.port
}

describe('starting the server', () => {
  it('opens the port it was given', async () => {
    const server = await startServer(express(), 0)
    const port = portOf(server)
    server.close()
    expect(port).toBeGreaterThan(0)
  })

  it('fails when the port is already taken', async () => {
    const first = await startServer(express(), 0)
    await expect(startServer(express(), portOf(first))).rejects.toMatchObject({
      code: 'EADDRINUSE',
    })
    first.close()
  })
})

describe('stopping the server', () => {
  it('finishes a request that is already running', async () => {
    let markStarted: () => void = () => undefined
    const requestStarted = new Promise<void>((resolve) => {
      markStarted = resolve
    })
    const app = express().get('/slow', (_req, res) => {
      markStarted()
      setTimeout(() => res.send('done'), 50)
    })
    const server = await startServer(app, 0)
    const response = fetch(`http://127.0.0.1:${String(portOf(server))}/slow`)
    await requestStarted

    await stopServer(server)

    expect(await (await response).text()).toBe('done')
  })

  it('takes no new connections once stopped', async () => {
    const server = await startServer(express(), 0)
    const port = portOf(server)
    await stopServer(server)
    await expect(fetch(`http://127.0.0.1:${String(port)}/`)).rejects.toThrow()
  })
})
