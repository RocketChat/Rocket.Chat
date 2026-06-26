// CRASHER — a background service that crashes its OWN worker thread once,
// shortly after boot, to test the runtime's auto-restart-on-error behavior
// (runtime config restartOnError defaults to true). A marker file is used so the
// crash happens only on the first boot; the restarted worker survives.
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const { logger } = globalThis.platformatic
const marker = join(process.cwd(), '.crasher-already-crashed')

if (!existsSync(marker)) {
  writeFileSync(marker, String(Date.now()))
  logger.warn({ pid: process.pid }, '[crasher] FIRST boot -> will crash this worker (process.exit(1)) in 300ms')
  setTimeout(() => process.exit(1), 300)
} else {
  logger.info({ pid: process.pid }, '[crasher] RESTARTED boot -> surviving (runtime auto-restarted the crashed worker)')
}

logger.info('[crasher] ready')
