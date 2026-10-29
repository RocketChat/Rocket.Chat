#!/usr/bin/env node
// Fails when a file has more rocket.chat/spacing-scale violations than baseline.json allows,
// or fewer (a stale entry), so the baseline only ever shrinks.
//
// Usage: node scripts/spacing-scale/check.mjs [--prune | --suppress-all]
//   --prune         lowers the baseline to the current counts after sites are fixed
//   --suppress-all  records every current violation (only when the rule itself changes)

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const baselinePath = join(here, 'baseline.json');
const RULE = 'rocket.chat(spacing-scale)';

const lint = () => {
	const { ignorePatterns } = JSON.parse(readFileSync(join(root, '.oxlintrc.json'), 'utf8'));
	const { stdout, stderr, status } = spawnSync(
		join(root, 'node_modules/.bin/oxlint'),
		['-c', join(here, 'oxlintrc.json'), '-f', 'json', ...ignorePatterns.flatMap((pattern) => ['--ignore-pattern', pattern])],
		{ cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
	);
	if (status !== 0 && status !== 1) throw new Error(`oxlint exited with ${status}\n${stderr}`);
	return JSON.parse(stdout).diagnostics.filter((diagnostic) => diagnostic.code === RULE);
};

const countByFile = (diagnostics) => {
	const counts = {};
	for (const { filename } of diagnostics) counts[filename] = (counts[filename] ?? 0) + 1;
	return counts;
};

const write = (counts) => {
	const sorted = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
	writeFileSync(baselinePath, `${JSON.stringify(sorted, null, '\t')}\n`);
};

const diagnostics = lint();
const current = countByFile(diagnostics);
const command = `node ${relative(process.cwd(), join(here, 'check.mjs'))}`;

if (process.argv.includes('--suppress-all')) {
	write(current);
	console.log(`Recorded ${diagnostics.length} violations in ${Object.keys(current).length} files.`);
	process.exit(0);
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const files = new Set([...Object.keys(baseline), ...Object.keys(current)]);
const added = [...files].filter((file) => (current[file] ?? 0) > (baseline[file] ?? 0));
const fixed = [...files].filter((file) => (current[file] ?? 0) < (baseline[file] ?? 0));

if (process.argv.includes('--prune')) {
	write(
		Object.fromEntries(
			Object.entries(baseline)
				.map(([file, count]) => [file, Math.min(count, current[file] ?? 0)])
				.filter(([, count]) => count > 0),
		),
	);
	console.log(`Lowered the baseline for ${fixed.length} files.`);
} else if (fixed.length) {
	console.error(`Fewer spacing-scale violations than the baseline records in:\n${fixed.map((file) => `  ${file}`).join('\n')}`);
	console.error(`Run \`${command} --prune\` and commit scripts/spacing-scale/baseline.json.\n`);
}

if (added.length) {
	console.error('New spacing values that are not Fuselage spacing tokens:');
	for (const file of added) {
		console.error(`\n${file} (${current[file]} found, ${baseline[file] ?? 0} allowed by the baseline)`);
		for (const { message, labels } of diagnostics.filter((diagnostic) => diagnostic.filename === file)) {
			console.error(`  ${labels[0].span.line}:${labels[0].span.column}  ${message}`);
		}
	}
}

process.exit(added.length || (fixed.length && !process.argv.includes('--prune')) ? 1 : 0);
