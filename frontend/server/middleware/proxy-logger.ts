export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/')) return

  const start = Date.now()
  const method = event.method
  const path = event.path

  console.log(`[PROXY] --> ${method} ${path}`)

  event.node.res.on('finish', () => {
    const status = event.node.res.statusCode
    const ms = Date.now() - start
    const level = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO'
    console.log(`[PROXY] <-- ${method} ${path} ${status} (${ms}ms) [${level}]`)
  })

  event.node.res.on('error', (err: Error) => {
    const ms = Date.now() - start
    console.error(`[PROXY] <-- ${method} ${path} FAILED after ${ms}ms:`, err.message)
  })
})
