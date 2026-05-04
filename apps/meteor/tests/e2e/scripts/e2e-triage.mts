/*
 * Produce the Phase 1 triage worklist for the E2E performance migration.
 *
 * Reads every spec under apps/meteor/tests/e2e/, counts signals that suggest
 * the spec is a strong candidate for Patterns 1/2 (API seeding + shared
 * context), and writes the result as a markdown table.
 *
 * Run with:
 *   node --experimental-strip-types apps/meteor/tests/e2e/scripts/e2e-triage.mts
 *
 * Output: docs/proposals/e2e-migration-triage.md
 *
 * ci_median_ms is left blank for a human to fill in from the latest Playwright
 * report (priority_score is recomputed when that is known).
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const E2E_ROOT = resolve(HERE, '..');
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..', '..');
const OUT_PATH = resolve(REPO_ROOT, 'docs', 'proposals', 'e2e-migration-triage.md');

const UI_SETUP_PATTERNS = [
	/content\.sendMessage\b/g,
	/openLastMessageMenu\b/g,
	/btnCreateDiscussionModal\b/g,
	/btnCreateChannel\b/g,
	/btnCreateDirectMessage\b/g,
] as const;

const DO_NOT_MIGRATE: Record<string, string> = {
	'create-channel.spec.ts': 'subject is creation UI',
	'create-direct.spec.ts': 'subject is creation UI',
	'create-discussion.spec.ts': 'subject is creation UI',
	'channel-management.spec.ts': 'subject includes create flows',
	'account-login.spec.ts': 'auth/session suite',
	'account-forgetSessionOnWindowClose.spec.ts': 'auth/session suite',
	'account-manage-devices.spec.ts': 'auth/session suite',
	'enforce-2FA.spec.ts': 'auth/session suite',
};

function listSpecFiles(root: string): string[] {
	const out: string[] = [];
	function walk(dir: string): void {
		for (const entry of readdirSync(dir)) {
			if (entry === 'node_modules' || entry === 'scripts' || entry.startsWith('.')) continue;
			const full = join(dir, entry);
			const info = statSync(full);
			if (info.isDirectory()) {
				if (entry === 'federation') continue;
				walk(full);
			} else if (info.isFile() && full.endsWith('.spec.ts')) {
				out.push(full);
			}
		}
	}
	walk(root);
	return out.sort();
}

function findBalancedClose(source: string, openIdx: number, openChar: string, closeChar: string): number {
	let depth = 0;
	let inString: string | null = null;
	let inLineComment = false;
	let inBlockComment = false;

	for (let i = openIdx; i < source.length; i++) {
		const c = source[i];
		const next = source[i + 1];

		if (inLineComment) {
			if (c === '\n') inLineComment = false;
			continue;
		}
		if (inBlockComment) {
			if (c === '*' && next === '/') {
				inBlockComment = false;
				i++;
			}
			continue;
		}
		if (inString) {
			if (c === '\\') {
				i++;
				continue;
			}
			if (c === inString) inString = null;
			continue;
		}

		if (c === '/' && next === '/') {
			inLineComment = true;
			i++;
			continue;
		}
		if (c === '/' && next === '*') {
			inBlockComment = true;
			i++;
			continue;
		}
		if (c === '"' || c === "'" || c === '`') {
			inString = c;
			continue;
		}
		if (c === openChar) depth++;
		else if (c === closeChar) {
			depth--;
			if (depth === 0) return i;
		}
	}
	return -1;
}

function countPatterns(chunk: string): number {
	let hits = 0;
	for (const rx of UI_SETUP_PATTERNS) {
		hits += (chunk.match(rx) || []).length;
	}
	return hits;
}

function extractBlocks(source: string, anchorRegex: RegExp): { range: string; startIdx: number }[] {
	const blocks: { range: string; startIdx: number }[] = [];
	let m: RegExpExecArray | null;
	// Fresh regex with global flag each call to reset lastIndex.
	const rx = new RegExp(anchorRegex.source, 'g');
	while ((m = rx.exec(source)) !== null) {
		const openParen = source.indexOf('(', m.index + m[0].length - 1);
		if (openParen === -1) continue;
		const closeParen = findBalancedClose(source, openParen, '(', ')');
		if (closeParen === -1) continue;
		blocks.push({ range: source.slice(openParen + 1, closeParen), startIdx: m.index });
	}
	return blocks;
}

function countUiHitsInSetupScope(source: string): number {
	let hits = 0;

	const hookBlocks = extractBlocks(source, /\btest\.(?:beforeAll|beforeEach)\b/);
	for (const block of hookBlocks) {
		hits += countPatterns(block.range);
	}

	const stepBlocks = extractBlocks(source, /\btest\.step\b/);
	for (const block of stepBlocks) {
		// A test.step is "setup-only" when it makes no assertions.
		if (!/\bexpect\s*\(/.test(block.range)) {
			hits += countPatterns(block.range);
		}
	}

	return hits;
}

type Row = {
	path: string;
	isSerial: boolean;
	uiSetupHits: number;
	optOutReason: string;
};

function triageRow(fullPath: string): Row {
	const source = readFileSync(fullPath, 'utf8');
	const relPath = relative(E2E_ROOT, fullPath);
	const basename = relPath.split('/').pop()!;

	const isSerial = /\btest\.describe\.serial\b/.test(source);
	const uiSetupHits = countUiHitsInSetupScope(source);
	const optOutReason = DO_NOT_MIGRATE[basename] ?? '';

	return { path: relPath, isSerial, uiSetupHits, optOutReason };
}

function computePriorityScore(row: Row, ciMedianMs: number | null): string {
	if (row.optOutReason) return '—';
	if (ciMedianMs == null) return '—';
	return String(ciMedianMs * ((row.isSerial ? 1 : 0) + row.uiSetupHits));
}

function renderMarkdown(rows: Row[]): string {
	const ciKnown = false;

	const migrateRows = rows.filter((r) => !r.optOutReason);
	const optOutRows = rows.filter((r) => r.optOutReason);

	const header = `# E2E migration triage

Generated worklist for the migration plan at [e2e-performance-migration.md](./e2e-performance-migration.md).

Produced by \`apps/meteor/tests/e2e/scripts/e2e-triage.mts\`. Re-run whenever the spec
surface changes; commit the result.

\`ci_median_ms\` is intentionally left blank — pull it from the latest Playwright
report on \`main\` and recompute \`priority_score\` (\`ci_median_ms * (is_serial + ui_setup_hits)\`)
before picking a batch. Until then, rows are sorted by \`(is_serial * 5) + ui_setup_hits\`
as a rough stand-in.

- Total specs: ${rows.length}
- Candidates for Phase 2: ${migrateRows.length}
- Opt-out: ${optOutRows.length}
- Serial suites: ${rows.filter((r) => r.isSerial).length}
- Specs with at least one UI setup hit: ${rows.filter((r) => r.uiSetupHits > 0).length}

## Phase 2 candidates

Sorted by the stand-in priority until \`ci_median_ms\` is populated.
`;

	const sorted = migrateRows.slice().sort((a, b) => {
		const scoreA = (a.isSerial ? 5 : 0) + a.uiSetupHits;
		const scoreB = (b.isSerial ? 5 : 0) + b.uiSetupHits;
		if (scoreB !== scoreA) return scoreB - scoreA;
		return a.path.localeCompare(b.path);
	});

	const tableHeader = '| path | is_serial | ui_setup_hits | ci_median_ms | priority_score |';
	const tableSep = '| --- | :-: | --: | --: | --: |';
	const tableRows = sorted.map((r) => {
		const priority = computePriorityScore(r, ciKnown ? 0 : null);
		return `| \`${r.path}\` | ${r.isSerial ? 'yes' : 'no'} | ${r.uiSetupHits} | — | ${priority} |`;
	});

	const optOutHeader = `\n## Opt-out\n\nSpecs the plan explicitly excludes from the migration. See Phase 1 of\n[e2e-performance-migration.md](./e2e-performance-migration.md) for the rationale.\n`;

	const optOutTableHeader = '| path | reason |';
	const optOutTableSep = '| --- | --- |';
	const optOutTableRows = optOutRows
		.slice()
		.sort((a, b) => a.path.localeCompare(b.path))
		.map((r) => `| \`${r.path}\` | ${r.optOutReason} |`);

	return [header, tableHeader, tableSep, ...tableRows, optOutHeader, optOutTableHeader, optOutTableSep, ...optOutTableRows, ''].join('\n');
}

function main(): void {
	const files = listSpecFiles(E2E_ROOT);
	const rows = files.map(triageRow);
	const markdown = renderMarkdown(rows);
	writeFileSync(OUT_PATH, markdown);
	// eslint-disable-next-line no-console
	console.log(`Wrote ${OUT_PATH} (${rows.length} specs)`);
}

main();
