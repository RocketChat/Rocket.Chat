#!/usr/bin/env node

/**
 * Disposable migration script: moves multiple modules from a TSV manifest.
 *
 * Usage:
 *   node move-batch.mjs <manifest.tsv>
 *
 * Manifest format (TSV, one pair per line):
 *   app/slashcommands-ban/server	server/commands/ban
 *   app/slashcommands-kick/server	server/commands/kick
 *
 * After all moves, runs `tsc --noEmit` to verify.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const manifestPath = process.argv[2];

if (!manifestPath) {
	console.error('Usage: node move-batch.mjs <manifest.tsv>');
	process.exit(1);
}

const manifest = fs.readFileSync(manifestPath, 'utf8')
	.split('\n')
	.map((line) => line.trim())
	.filter((line) => line && !line.startsWith('#'));

console.log(`Processing ${manifest.length} entries from ${manifestPath}\n`);

let failed = 0;

for (const line of manifest) {
	const [fromDir, toDir] = line.split('\t').map((s) => s.trim());
	if (!fromDir || !toDir) {
		console.error(`Skipping malformed line: ${line}`);
		failed++;
		continue;
	}

	try {
		const scriptPath = path.join(import.meta.dirname, 'move-module.mjs');
		execSync(`node "${scriptPath}" --from "${fromDir}" --to "${toDir}"`, {
			cwd: ROOT,
			stdio: 'inherit',
		});
	} catch (err) {
		console.error(`FAILED: ${fromDir} → ${toDir}`);
		console.error(err.message);
		failed++;
	}
}

console.log(`\n${'─'.repeat(60)}`);
console.log(`Batch complete. ${manifest.length - failed}/${manifest.length} succeeded.`);

if (failed > 0) {
	console.error(`${failed} entries failed.`);
	process.exit(1);
}

// Run TypeScript check
console.log('\nRunning tsc --noEmit to verify...');
try {
	execSync('npx tsc --noEmit', { cwd: ROOT, stdio: 'inherit', timeout: 300_000 });
	console.log('TypeScript check passed.');
} catch {
	console.error('TypeScript check FAILED. Fix the errors above before committing.');
	process.exit(1);
}
