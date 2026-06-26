// ---------------------------------------------------------------------------
// Q5c: forced crash -> does the runtime auto-restart the worker?
// Boots a 1-app runtime (crasher). The crasher crashes its own worker thread
// once on first boot. We watch the lifecycle events to see the runtime restart
// it. restartOnError defaults to true.
// Run: node crash-test.mjs   (clears the crash marker first)
// ---------------------------------------------------------------------------
import { create } from '@platformatic/runtime'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

// Reset marker so the crasher crashes on this run's first boot.
// NOTE: worker process.cwd() is the runtime root (scratch/), not the app dir.
try { rmSync(join(root, '.crasher-already-crashed')) } catch {}

const runtime = await create(root, join(root, 'watt-crash.json'), { setupSignals: false, start: true })

let started = 0
let errored = false
runtime.on('application:worker:error', p => { errored = true; console.log('   [EVENT] application:worker:error', JSON.stringify(p)) })
runtime.on('application:worker:exited', p => console.log('   [EVENT] application:worker:exited', JSON.stringify(p)))
runtime.on('application:worker:started', p => { started++; console.log('   [EVENT] application:worker:started', JSON.stringify(p)) })

console.log('\n=== [HOST] crasher running; first worker will self-crash. Watching for auto-restart... ===')

// Wait to observe crash + auto-restart.
await new Promise(r => setTimeout(r, 7000))

console.log(`\n=== [HOST] worker:started events seen: ${started} (>=2 means it was auto-restarted) ===`)
console.log(`=== [HOST] worker:error event seen: ${errored} ===`)
console.log('   crasher status now:', (await runtime.getApplicationDetails('crasher', true)).status)

await runtime.close()
process.exit(0)
