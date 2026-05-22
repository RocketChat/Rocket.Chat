#!/usr/bin/env node
// Inject methodDeprecationLogger.method(...) into every orphan and every used-with-REST
// DDP method recorded in docs/ddp-audit.json. Skips methods that already have the call.
//
// Usage:
//   node scripts/add-ddp-deprecation.mjs --dry-run    # print planned edits, no writes
//   node scripts/add-ddp-deprecation.mjs --apply       # write the edits
//   node scripts/add-ddp-deprecation.mjs --only orphans|used-with-rest
//
// Requires docs/ddp-audit.json (run scripts/audit-ddp-methods.mjs first).

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIT = join(ROOT, 'docs/ddp-audit.json');
const LOGGER_MODULE = 'apps/meteor/app/lib/server/lib/deprecationWarningLogger';
const NEXT_VERSION = '9.0.0';
const LOGGER_NAME = 'methodDeprecationLogger';

const argv = process.argv.slice(2);
const flags = {
	apply: argv.includes('--apply'),
	dryRun: argv.includes('--dry-run') || !argv.includes('--apply'),
	only: (() => {
		const i = argv.indexOf('--only');
		return i >= 0 ? argv[i + 1] : 'all';
	})(),
	limit: (() => {
		const i = argv.indexOf('--limit');
		return i >= 0 ? Number(argv[i + 1]) : Infinity;
	})(),
};

function loadAudit() {
	const raw = readFileSync(AUDIT, 'utf8');
	return JSON.parse(raw);
}

function importPathFor(methodFileAbs) {
	const rel = relative(dirname(methodFileAbs), join(ROOT, LOGGER_MODULE));
	return rel.startsWith('.') ? rel : `./${rel}`;
}

// Build replacement literal for the logger call. Returns the source-text fragment
// like `'/v1/foo'` or `['/v1/a', '/v1/b']` or `[]`.
function replacementLiteral(rest) {
	if (!rest) return '[]';
	if (Array.isArray(rest)) {
		if (rest.length === 0) return '[]';
		return `[${rest.map((r) => `'${prefixV1(r)}'`).join(', ')}]`;
	}
	return `'${prefixV1(rest)}'`;
}

function prefixV1(path) {
	if (path.startsWith('/')) return path;
	return `/v1/${path}`;
}

// Find the byte offset of the opening `{` of the method body for a key located at
// 1-based line `keyLine` in `src`. Strategy: scan forward from key line and accept
// the first `{` whose nearest preceding non-whitespace token is `)` (param list end)
// or `>` (arrow). Skip over `{ ... }` blocks that don't satisfy this (destructuring,
// type annotations, etc). Skip strings/comments.
function findBodyOpenBrace(src, keyLine) {
	const lines = src.split('\n');
	if (keyLine < 1 || keyLine > lines.length) return null;
	let offset = 0;
	for (let i = 0; i < keyLine - 1; i++) offset += lines[i].length + 1;
	const winEnd = Math.min(src.length, offset + 6000);

	let i = offset;
	let lastNonWs = '';
	let lastNonWsPrev = '';
	while (i < winEnd) {
		const c = src[i];
		if (c === '/' && src[i + 1] === '/') {
			const nl = src.indexOf('\n', i);
			i = nl === -1 ? winEnd : nl + 1;
			continue;
		}
		if (c === '/' && src[i + 1] === '*') {
			const end = src.indexOf('*/', i + 2);
			i = end === -1 ? winEnd : end + 2;
			continue;
		}
		if (c === '"' || c === "'" || c === '`') {
			const q = c;
			i++;
			while (i < winEnd) {
				if (src[i] === '\\') { i += 2; continue; }
				if (src[i] === q) { i++; break; }
				i++;
			}
			lastNonWsPrev = lastNonWs;
			lastNonWs = q;
			continue;
		}
		if (c === '{') {
			// Accept as body if preceded by `)` (end of args) or `>` (generic close
			// of a return type, or part of `=>` arrow). Otherwise skip the block.
			if (lastNonWs === ')' || lastNonWs === '>') return i;
			// Skip past this brace block and keep searching.
			let depth = 1;
			i++;
			while (i < src.length && depth > 0) {
				const cc = src[i];
				if (cc === '/' && src[i + 1] === '/') {
					const nl = src.indexOf('\n', i);
					i = nl === -1 ? src.length : nl + 1;
					continue;
				}
				if (cc === '/' && src[i + 1] === '*') {
					const end = src.indexOf('*/', i + 2);
					i = end === -1 ? src.length : end + 2;
					continue;
				}
				if (cc === '"' || cc === "'" || cc === '`') {
					const q = cc;
					i++;
					while (i < src.length) {
						if (src[i] === '\\') { i += 2; continue; }
						if (src[i] === q) { i++; break; }
						i++;
					}
					continue;
				}
				if (cc === '{') depth++;
				else if (cc === '}') depth--;
				i++;
			}
			lastNonWsPrev = lastNonWs;
			lastNonWs = '}';
			continue;
		}
		if (!/\s/.test(c)) {
			lastNonWsPrev = lastNonWs;
			lastNonWs = c;
		}
		i++;
	}
	return null;
}

function hasExistingLoggerCall(src, methodName) {
	return src.includes(`${LOGGER_NAME}.method('${methodName}'`) ||
		src.includes(`${LOGGER_NAME}.method("${methodName}"`);
}

function ensureImport(src, methodFileAbs) {
	if (src.includes(`{ ${LOGGER_NAME} }`) || src.match(new RegExp(`\\b${LOGGER_NAME}\\b.*from`))) {
		return { src, added: false };
	}
	const importPath = importPathFor(methodFileAbs);
	// Rocket.Chat convention: external imports first group, then a blank line, then
	// relative imports (`./` or `../`). The new import is relative, so insert it
	// after the last relative import. If there are no relative imports yet, append
	// after the last external import with a blank-line separator.
	const importRe = /^import\s+(?:type\s+)?(?:[^'"]*?from\s+)?['"]([^'"]+)['"];?[ \t]*\r?\n/gm;
	const imports = [];
	let m;
	while ((m = importRe.exec(src))) {
		imports.push({ start: m.index, end: m.index + m[0].length, path: m[1] });
	}
	const importLine = `import { ${LOGGER_NAME} } from '${importPath}';\n`;

	if (imports.length === 0) {
		return { src: importLine + src, added: true };
	}

	const relativeImports = imports.filter((imp) => imp.path.startsWith('.'));

	if (relativeImports.length > 0) {
		const last = relativeImports[relativeImports.length - 1];
		return { src: src.slice(0, last.end) + importLine + src.slice(last.end), added: true };
	}

	const last = imports[imports.length - 1];
	return { src: src.slice(0, last.end) + '\n' + importLine + src.slice(last.end), added: true };
}

function indentOfLine(src, lineOpenBraceOffset) {
	// Compute indent inside the body: one tab deeper than the line containing the brace.
	let lineStart = lineOpenBraceOffset;
	while (lineStart > 0 && src[lineStart - 1] !== '\n') lineStart--;
	const lineIndent = src.slice(lineStart, lineOpenBraceOffset).match(/^\s*/)[0];
	return lineIndent + '\t';
}

function injectLoggerCall(src, openBraceOffset, methodName, restLiteral) {
	const indent = indentOfLine(src, openBraceOffset);
	const stmt = `\n${indent}${LOGGER_NAME}.method('${methodName}', '${NEXT_VERSION}', ${restLiteral});`;
	// Insert immediately after the `{`.
	return src.slice(0, openBraceOffset + 1) + stmt + src.slice(openBraceOffset + 1);
}

function planTargets(audit) {
	const targets = [];
	if (flags.only === 'all' || flags.only === 'orphans') {
		for (const r of audit.orphans) {
			targets.push({ kind: 'orphan', record: r, restReplacement: r.restReplacement || null });
		}
	}
	if (flags.only === 'all' || flags.only === 'used-with-rest') {
		for (const r of audit.used) {
			if (r.restReplacement) {
				targets.push({ kind: 'used-with-rest', record: r, restReplacement: r.restReplacement });
			}
		}
	}
	return targets;
}

function main() {
	const audit = loadAudit();
	const targets = planTargets(audit).slice(0, flags.limit);

	// Group registrations by file so we can edit each file once (multiple methods).
	const byFile = new Map();
	for (const t of targets) {
		for (const reg of t.record.registrations) {
			const fileAbs = join(ROOT, reg.file);
			if (!byFile.has(fileAbs)) byFile.set(fileAbs, []);
			byFile.get(fileAbs).push({ method: t.record.method, line: reg.line, rest: t.restReplacement, kind: t.kind });
		}
	}

	const summary = { files: 0, methods: 0, skippedAlreadyHasCall: 0, skippedBodyNotFound: 0, perFile: [] };
	const fileResults = [];

	for (const [fileAbs, entries] of byFile) {
		let src;
		try { src = readFileSync(fileAbs, 'utf8'); } catch (e) {
			console.error(`SKIP (read failed): ${relative(ROOT, fileAbs)}`);
			continue;
		}

		// Sort entries by line desc so insertions don't shift later lines.
		entries.sort((a, b) => b.line - a.line);

		const planned = [];
		let workSrc = src;
		let inserted = 0;
		for (const e of entries) {
			if (hasExistingLoggerCall(workSrc, e.method)) {
				summary.skippedAlreadyHasCall++;
				continue;
			}
			const bodyOpen = findBodyOpenBrace(workSrc, e.line);
			if (bodyOpen === null) {
				summary.skippedBodyNotFound++;
				console.error(`SKIP (body not found): ${relative(ROOT, fileAbs)} :: ${e.method} @${e.line}`);
				continue;
			}
			const restLit = replacementLiteral(e.rest);
			workSrc = injectLoggerCall(workSrc, bodyOpen, e.method, restLit);
			planned.push({ method: e.method, line: e.line, restLit, kind: e.kind });
			inserted++;
		}

		if (inserted === 0) continue;

		// Add import after first edit if not present.
		const withImport = ensureImport(workSrc, fileAbs);
		workSrc = withImport.src;

		summary.files++;
		summary.methods += inserted;
		summary.perFile.push({ file: relative(ROOT, fileAbs), inserted, planned, importAdded: withImport.added });
		fileResults.push({ fileAbs, workSrc });
	}

	console.error('');
	console.error(`Plan: ${summary.methods} methods in ${summary.files} files`);
	console.error(`  skipped (already-has-call): ${summary.skippedAlreadyHasCall}`);
	console.error(`  skipped (body-not-found):   ${summary.skippedBodyNotFound}`);
	console.error('');

	for (const f of summary.perFile.slice(0, 20)) {
		console.error(`  ${f.file}${f.importAdded ? ' [+import]' : ''}`);
		for (const p of f.planned) console.error(`    + ${p.method} (${p.kind}) -> ${p.restLit}`);
	}
	if (summary.perFile.length > 20) console.error(`  ... and ${summary.perFile.length - 20} more files`);

	if (flags.apply) {
		for (const { fileAbs, workSrc } of fileResults) {
			writeFileSync(fileAbs, workSrc);
		}
		console.error('');
		console.error(`Wrote ${fileResults.length} files.`);
	} else {
		console.error('');
		console.error('Dry run only. Pass --apply to write changes.');
	}

	// Persist plan JSON for review.
	const planPath = join(ROOT, 'docs/ddp-deprecation-plan.json');
	writeFileSync(planPath, JSON.stringify(summary, null, 2));
	console.error(`Plan saved: ${relative(ROOT, planPath)}`);
}

main();
