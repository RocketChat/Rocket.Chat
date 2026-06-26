// Q6: observability — confirm the runtime exposes Prometheus metrics out of the
// box (just by enabling `metrics` in config) via runtime.getMetrics().
import { create } from '@platformatic/runtime'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const runtime = await create(root, join(root, 'watt-metrics.json'), { setupSignals: false, start: true })

await new Promise(r => setTimeout(r, 1000))

const { metrics } = await runtime.getMetrics('text')
const lines = String(metrics).split('\n').filter(l => l.startsWith('# HELP'))
console.log(`\n=== [HOST] getMetrics() returned ${lines.length} metric families. Sample: ===`)
console.log(lines.slice(0, 15).join('\n'))

await runtime.close()
process.exit(0)
