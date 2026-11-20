import type { Server } from 'node:http'
import express from 'express'
import { describe, expect, it } from 'vitest'
import { startServer } from './start-server'

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
