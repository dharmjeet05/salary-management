import { createServer, type RequestListener, type Server } from 'node:http'

// Resolves once the port is open and rejects if it can't be, for example when
// another process already uses it.
export function startServer(handler: RequestListener, port: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = createServer(handler)
    server.once('error', reject)
    server.listen(port, () => {
      server.off('error', reject)
      resolve(server)
    })
  })
}

// Stops taking new connections and resolves once the requests already
// running have been answered.
export function stopServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}
