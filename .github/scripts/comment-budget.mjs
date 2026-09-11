#!/usr/bin/env node
/**
 * Reports the share of added lines that are comments, against `docs/code-comments.md`.
 * Advisory only — never exits non-zero: only a reviewer can tell a genuinely
 * documentation-heavy PR from an over-commented one.
 *   node .github/scripts/comment-budget.mjs [base-ref]   # default: origin/develop
 */

import { execFileSync } from 'node:child_process';

const BUDGET = 0.1;
const REPO_AVERAGE = 0.043;

const baseRef = process.argv[2] ?? 'origin/develop';

const CODE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const EXCLUDED = /(\.spec\.|\.test\.|\.stories\.|\/tests?\/|\/__mocks__\/|\/node_modules\/|\/dist\/)/;
const COMMENT = /^\+\s*(\/\/|\/\*|\*)/;

const diff = execFileSync('git', ['diff', '--unified=0', `${baseRef}...HEAD`], {
	encoding: 'utf8',
	maxBuffer: 256 * 1024 * 1024,
});

const perFile = new Map();
let file = null;

for (const line of diff.split('\n')) {
	if (line.startsWith('+++ ')) {
		const path = line.slice(6);
		file = CODE.test(path) && !EXCLUDED.test(path) ? path : null;
		if (file && !perFile.has(file)) {
			perFile.set(file, { added: 0, comments: 0 });
		}
		continue;
	}

	if (!file || !line.startsWith('+') || line.startsWith('+++')) {
		continue;
	}

	const stats = perFile.get(file);
	stats.added += 1;
	if (COMMENT.test(line)) {
		stats.comments += 1;
	}
}

const added = [...perFile.values()].reduce((sum, s) => sum + s.added, 0);
const comments = [...perFile.values()].reduce((sum, s) => sum + s.comments, 0);

if (added < 100) {
	console.log(`comment-budget: ${added} production lines added — too few to judge. Skipping.`);
	process.exit(0);
}

const ratio = comments / added;
const pct = (n) => `${(n * 100).toFixed(1)}%`;

console.log(`comment-budget: ${comments}/${added} added production lines are comments (${pct(ratio)}).`);
console.log(`  budget ${pct(BUDGET)} · repository average ${pct(REPO_AVERAGE)}`);

if (ratio <= BUDGET) {
	process.exit(0);
}

const worst = [...perFile.entries()]
	.filter(([, s]) => s.added >= 40)
	.sort((a, b) => b[1].comments / b[1].added - a[1].comments / a[1].added)
	.slice(0, 5);

for (const [path, s] of worst) {
	console.log(`  ${pct(s.comments / s.added).padStart(6)}  ${s.comments}/${s.added}  ${path}`);
}

const message = [
	`${pct(ratio)} of the production lines this PR adds are comments, over the ${pct(BUDGET)} budget`,
	`(the repository averages ${pct(REPO_AVERAGE)}).`,
	'Re-read the diff looking only at comments: delete the ones that restate the code, narrate the change,',
	'or record how the change was reached — that belongs in the PR description. See docs/code-comments.md.',
].join(' ');

console.log(`::warning title=Comment budget::${message}`);
