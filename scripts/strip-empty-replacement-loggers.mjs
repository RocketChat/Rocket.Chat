#!/usr/bin/env node
// Strip every `methodDeprecationLogger.method('name', '9.0.0', []);` line from
// the working tree (and, if no other `methodDeprecationLogger` reference is
// left in the file, also strip the import). Files that end up identical to the
// merge-base with origin/develop are reverted to that baseline so the diff for
// the develop-targeted PR only contains the entries that point to a real REST
// replacement.
//
// Usage:
//   node scripts/strip-empty-replacement-loggers.mjs --dry-run    # default
//   node scripts/strip-empty-replacement-loggers.mjs --apply

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flags = { apply: argv.includes('--apply') };

const LOGGER = 'methodDeprecationLogger';
const EMPTY_CALL = new RegExp(`^\\s*${LOGGER}\\.method\\('[^']+',\\s*'9\\.0\\.0',\\s*\\[\\]\\);\\s*\\r?\\n`, 'm');
const ANY_CALL = new RegExp(`\\b${LOGGER}\\.method\\(`);
const IMPORT_RE = new RegExp(`^import\\s+\\{\\s*${LOGGER}\\s*\\}\\s+from\\s+['"][^'"]+['"];?\\s*\\r?\\n`, 'm');

function changedFiles() {
	const out = execSync('git -c color.ui=never diff --name-only origin/develop...HEAD', { cwd: ROOT, encoding: 'utf8' });
	return out.split('\n').filter((l) => l && /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(l));
}

function fileContentAtBase(rel) {
	try {
		return execSync(`git show "origin/develop:${rel}"`, { cwd: ROOT, encoding: 'utf8' });
	} catch {
		return null;
	}
}

function stripEmptyCalls(src) {
	let out = src;
	let changed = false;
	while (EMPTY_CALL.test(out)) {
		out = out.replace(EMPTY_CALL, '');
		changed = true;
	}
	return { src: out, changed };
}

function stripLoggerImport(src) {
	if (ANY_CALL.test(src)) return { src, changed: false };
	const next = src.replace(IMPORT_RE, '');
	return { src: next, changed: next !== src };
}

function main() {
	const files = changedFiles();
	const stats = { stripped: 0, revertedToBase: 0, importStripped: 0, skipped: 0, perFile: [] };

	for (const rel of files) {
		const abs = join(ROOT, rel);
		if (!existsSync(abs)) continue;
		const cur = readFileSync(abs, 'utf8');
		if (!EMPTY_CALL.test(cur)) continue;

		const stripped = stripEmptyCalls(cur);
		if (!stripped.changed) { stats.skipped++; continue; }
		stats.stripped++;

		const afterImport = stripLoggerImport(stripped.src);
		if (afterImport.changed) stats.importStripped++;
		let next = afterImport.src;

		const base = fileContentAtBase(rel);
		let revertedToBase = false;
		if (base !== null && next === base) {
			revertedToBase = true;
			stats.revertedToBase++;
		}

		stats.perFile.push({ file: rel, revertedToBase, importStripped: afterImport.changed });

		if (flags.apply) writeFileSync(abs, next);
	}

	console.error('');
	console.error(`Files with empty-replacement calls stripped: ${stats.stripped}`);
	console.error(`  + matched origin/develop (effectively reverted): ${stats.revertedToBase}`);
	console.error(`  + import of ${LOGGER} also dropped: ${stats.importStripped}`);
	console.error('');
	for (const f of stats.perFile.slice(0, 30)) {
		const tags = [];
		if (f.revertedToBase) tags.push('revert');
		if (f.importStripped) tags.push('drop-import');
		console.error(`  ${f.file}${tags.length ? '  [' + tags.join(',') + ']' : ''}`);
	}
	if (stats.perFile.length > 30) console.error(`  ... and ${stats.perFile.length - 30} more`);
	if (!flags.apply) console.error('\nDry run only. Pass --apply to write changes.');
}

main();
