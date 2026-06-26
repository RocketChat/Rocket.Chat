// PINGER — a background Watt service (no HTTP server).
// It sends a message to the "ponger" service over the runtime messaging mesh
// and logs the reply, then reports the V8 heap limit it was booted with so we
// can prove per-worker resourceLimits took effect.
import v8 from 'node:v8'

const { messaging, logger } = globalThis.platformatic

const heapLimitMb = Math.round(v8.getHeapStatistics().heap_size_limit / (1024 * 1024))
logger.info({ heapLimitMb, pid: process.pid }, '[pinger] worker booting (V8 heap_size_limit)')

// Give the ponger a moment to register its handler, then ping it a few times.
async function run () {
  for (let i = 1; i <= 3; i++) {
    try {
      // send(targetApplicationId, messageName, payload) -> reply
      const reply = await messaging.send('ponger', 'ping', { seq: i, from: 'pinger' })
      logger.info({ reply }, `[pinger] got reply for seq=${i}`)
    } catch (err) {
      logger.error({ err: err.message }, `[pinger] ping seq=${i} failed`)
    }
    await new Promise(r => setTimeout(r, 200))
  }
  logger.info('[pinger] done pinging')
}

// Delay slightly so both workers are up.
setTimeout(() => { run().catch(e => logger.error(e)) }, 500)
