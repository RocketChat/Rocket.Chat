// PONGER — a background Watt service (no HTTP server).
// It registers a messaging handler that other services can call.
// Inside a worker, the runtime exposes globalThis.platformatic.messaging.

import v8 from 'node:v8'

const { messaging, logger } = globalThis.platformatic

const heapLimitMb = Math.round(v8.getHeapStatistics().heap_size_limit / (1024 * 1024))
logger.info({ heapLimitMb, pid: process.pid }, '[ponger] worker booting (V8 heap_size_limit), registering "ping" handler')

// handle(name, fn): fn receives the message payload and must return the reply.
messaging.handle('ping', payload => {
  logger.info({ payload }, '[ponger] received ping')
  return { reply: 'pong', echo: payload, repliedAt: Date.now(), pid: process.pid }
})

// hasServer:false background services still need to keep the event loop alive.
// The runtime keeps the worker alive as long as it is started; nothing else to do.
logger.info('[ponger] ready')
