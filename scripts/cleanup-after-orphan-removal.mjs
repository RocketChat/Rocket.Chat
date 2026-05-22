#!/usr/bin/env node
// Cleanup pass that runs after scripts/remove-orphan-ddp-methods.mjs has
// stripped the Meteor.methods registrations. It walks every file in the
// staged-or-unstaged git diff and:
//
//   1. Removes import specifiers whose names no longer appear anywhere else in
//      the file (handles `import { a, b }`, `import x`, `import * as ns`, and
//      side-effect-only `import './foo';` — the last is preserved untouched).
//   2. Deletes the file entirely if, after the import cleanup, the only
//      remaining top-level constructs are imports, `declare module` blocks,
//      and comments.
//   3. For every deleted file, removes matching `import './basename';` and
//      `import './subdir/basename';` lines from sibling index.ts barrels.
//
// Usage:
//   node scripts/cleanup-after-orphan-removal.mjs --dry-run    # default
//   node scripts/cleanup-after-orphan-removal.mjs --apply

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { dirname, join, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flags = { apply: argv.includes('--apply') };

function changedFiles() {
	const out = execSync('git -c color.ui=never diff --name-only HEAD', { cwd: ROOT, encoding: 'utf8' });
	return out.split('\n').filter((l) => l && /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(l));
}

// Parse a single import statement starting at `i`. Returns { end, specifiers, source, kind }.
//   kind: 'named' | 'default' | 'namespace' | 'side-effect' | 'mixed'
//   specifiers: list of { local, imported } — local name and imported binding (same for default).
function parseImport(src, i) {
	// `i` points to 'i' of `import`.
	const start = i;
	let j = i + 'import'.length;
	while (j < src.length && /\s/.test(src[j])) j++;
	// Optional `type` keyword for type-only imports: `import type { X } from '...'`.
	let isTypeOnly = false;
	if (src.slice(j, j + 4) === 'type' && /\s/.test(src[j + 4])) {
		isTypeOnly = true;
		j += 4;
		while (j < src.length && /\s/.test(src[j])) j++;
	}
	const specifiers = [];
	let kind = 'named';

	if (src[j] === "'" || src[j] === '"') {
		// `import 'path';` — side-effect.
		const q = src[j];
		const end = src.indexOf(q, j + 1);
		if (end === -1) return null;
		let stmtEnd = end + 1;
		while (stmtEnd < src.length && src[stmtEnd] !== '\n') {
			if (src[stmtEnd] === ';') { stmtEnd++; break; }
			stmtEnd++;
		}
		if (src[stmtEnd] === '\n') stmtEnd++;
		return { start, end: stmtEnd, specifiers: [], source: src.slice(j + 1, end), kind: 'side-effect', isTypeOnly };
	}

	// Default import?
	if (/[A-Za-z_$]/.test(src[j])) {
		const m = src.slice(j).match(/^[A-Za-z_$][\w$]*/);
		if (m) {
			specifiers.push({ local: m[0], imported: 'default', kind: 'default' });
			j += m[0].length;
			while (j < src.length && /\s/.test(src[j])) j++;
			if (src[j] === ',') { j++; while (j < src.length && /\s/.test(src[j])) j++; }
			kind = 'default';
		}
	}

	// Namespace `* as Name`?
	if (src[j] === '*') {
		j++;
		while (j < src.length && /\s/.test(src[j])) j++;
		if (src.slice(j, j + 2) === 'as') {
			j += 2;
			while (j < src.length && /\s/.test(src[j])) j++;
			const m = src.slice(j).match(/^[A-Za-z_$][\w$]*/);
			if (m) {
				specifiers.push({ local: m[0], imported: '*', kind: 'namespace' });
				j += m[0].length;
			}
		}
		while (j < src.length && /\s/.test(src[j])) j++;
		kind = specifiers.length > 1 ? 'mixed' : 'namespace';
	}

	// Named `{ a, b as c }`?
	if (src[j] === '{') {
		j++;
		while (j < src.length && src[j] !== '}') {
			while (j < src.length && /[\s,]/.test(src[j])) j++;
			if (src[j] === '}') break;
			// Optional inline `type` keyword.
			let specType = false;
			if (src.slice(j, j + 4) === 'type' && /\s/.test(src[j + 4])) {
				specType = true;
				j += 4;
				while (j < src.length && /\s/.test(src[j])) j++;
			}
			const m = src.slice(j).match(/^[A-Za-z_$][\w$]*/);
			if (!m) break;
			let imported = m[0];
			let local = imported;
			j += imported.length;
			while (j < src.length && /\s/.test(src[j])) j++;
			if (src.slice(j, j + 2) === 'as') {
				j += 2;
				while (j < src.length && /\s/.test(src[j])) j++;
				const lm = src.slice(j).match(/^[A-Za-z_$][\w$]*/);
				if (lm) { local = lm[0]; j += lm[0].length; }
			}
			specifiers.push({ local, imported, kind: 'named', typeOnly: specType });
			while (j < src.length && /[\s,]/.test(src[j])) j++;
		}
		if (src[j] === '}') j++;
		while (j < src.length && /\s/.test(src[j])) j++;
		kind = specifiers.some((s) => s.kind === 'default') ? 'mixed' : 'named';
	}

	// Expect `from '...'`.
	if (src.slice(j, j + 4) !== 'from') return null;
	j += 4;
	while (j < src.length && /\s/.test(src[j])) j++;
	if (src[j] !== "'" && src[j] !== '"') return null;
	const q = src[j];
	const end = src.indexOf(q, j + 1);
	if (end === -1) return null;
	const source = src.slice(j + 1, end);
	let stmtEnd = end + 1;
	while (stmtEnd < src.length && src[stmtEnd] !== '\n') {
		if (src[stmtEnd] === ';') { stmtEnd++; break; }
		stmtEnd++;
	}
	if (src[stmtEnd] === '\n') stmtEnd++;
	return { start, end: stmtEnd, specifiers, source, kind, isTypeOnly };
}

function findAllImports(src) {
	const imports = [];
	let i = 0;
	while (i < src.length) {
		// Match `import` only at the start of a line (allowing leading whitespace).
		if (i === 0 || src[i - 1] === '\n') {
			let k = i;
			while (k < src.length && /[ \t]/.test(src[k])) k++;
			if (src.slice(k, k + 6) === 'import' && /\s/.test(src[k + 6])) {
				const imp = parseImport(src, k);
				if (imp) {
					imports.push(imp);
					i = imp.end;
					continue;
				}
			}
		}
		i++;
	}
	return imports;
}

// Returns the body of the file with all imports stripped (so usage of names can
// be tested without false positives from the import line itself).
function bodyWithoutImports(src, imports) {
	let out = '';
	let cursor = 0;
	for (const imp of imports) {
		out += src.slice(cursor, imp.start);
		cursor = imp.end;
	}
	out += src.slice(cursor);
	return out;
}

function nameIsUsed(name, body) {
	const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
	return re.test(body);
}

function rebuildImport(imp) {
	if (imp.kind === 'side-effect') {
		return `import '${imp.source}';\n`;
	}
	const parts = [];
	const defaults = imp.specifiers.filter((s) => s.kind === 'default');
	const ns = imp.specifiers.filter((s) => s.kind === 'namespace');
	const named = imp.specifiers.filter((s) => s.kind === 'named');
	if (defaults.length) parts.push(defaults[0].local);
	if (ns.length) parts.push(`* as ${ns[0].local}`);
	if (named.length) {
		const items = named.map((s) => {
			const head = s.typeOnly ? 'type ' : '';
			return head + (s.imported === s.local ? s.local : `${s.imported} as ${s.local}`);
		});
		parts.push(`{ ${items.join(', ')} }`);
	}
	const typeKw = imp.isTypeOnly ? 'type ' : '';
	return `import ${typeKw}${parts.join(', ')} from '${imp.source}';\n`;
}

function pruneImports(src) {
	const imports = findAllImports(src);
	if (imports.length === 0) return { src, changed: false };
	let body = bodyWithoutImports(src, imports);
	// Strip declare-module/global blocks and comments before checking usage —
	// names that only appear inside an interface augmentation are not real
	// usages of the imported binding.
	body = body.replace(/declare\s+module\s+['"][^'"]+['"]\s*\{([\s\S]*?)\n\}/g, '');
	body = body.replace(/declare\s+global\s*\{([\s\S]*?)\n\}/g, '');
	body = body.replace(/\/\*[\s\S]*?\*\//g, '');
	body = body.replace(/\/\/.*$/gm, '');

	let changed = false;
	const rewritten = imports.map((imp) => {
		if (imp.kind === 'side-effect') return imp; // keep
		const kept = imp.specifiers.filter((s) => nameIsUsed(s.local, body));
		if (kept.length === imp.specifiers.length) return imp;
		changed = true;
		if (kept.length === 0) return { ...imp, _drop: true };
		return { ...imp, specifiers: kept };
	});

	if (!changed) return { src, changed: false };

	let out = '';
	let cursor = 0;
	for (const imp of rewritten) {
		out += src.slice(cursor, imp.start);
		cursor = imp.end;
		if (imp._drop) continue;
		out += rebuildImport(imp);
	}
	out += src.slice(cursor);
	return { src: out, changed: true };
}

// Returns true if file has any top-level construct beyond imports, comments,
// blank lines, and `declare module` blocks. Used to decide whether to delete
// the file entirely.
function fileIsDead(src) {
	const imports = findAllImports(src);
	let body = bodyWithoutImports(src, imports);
	// Strip block comments.
	body = body.replace(/\/\*[\s\S]*?\*\//g, '');
	// Strip line comments.
	body = body.replace(/^[ \t]*\/\/.*$/gm, '');
	// Strip `declare module '...' { ... }` blocks.
	body = body.replace(/declare\s+module\s+['"][^'"]+['"]\s*\{([\s\S]*?)\n\}/g, '');
	// Strip `declare global { ... }` blocks.
	body = body.replace(/declare\s+global\s*\{([\s\S]*?)\n\}/g, '');
	// Strip remaining whitespace and stray semicolons.
	body = body.replace(/[\s;]/g, '');
	return body.length === 0;
}

function siblingBarrels(filePath) {
	// Look for index.ts files in this dir and parent dirs (apps/meteor side).
	const out = [];
	let dir = dirname(filePath);
	while (dir !== ROOT && dir !== '/' && dir.length > ROOT.length) {
		const candidates = ['index.ts', 'index.tsx', 'index.js'];
		for (const c of candidates) {
			const p = join(dir, c);
			if (p !== filePath && existsSync(p)) out.push(p);
		}
		dir = dirname(dir);
	}
	return out;
}

function removeSideEffectImport(barrelPath, deletedAbs) {
	if (!existsSync(barrelPath)) return false;
	const src = readFileSync(barrelPath, 'utf8');
	const baseNoExt = basename(deletedAbs).replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, '');
	// Patterns to match: import './basename'; or import './subdir/basename'; (any depth)
	const lines = src.split('\n');
	let removed = false;
	const kept = lines.filter((line) => {
		const m = line.match(/^\s*import\s+(['"])(\.[\w./-]+)\1\s*;?\s*$/);
		if (!m) return true;
		const spec = m[2];
		if (spec.endsWith(`/${baseNoExt}`) || spec === `./${baseNoExt}`) {
			removed = true;
			return false;
		}
		return true;
	});
	if (!removed) return false;
	writeFileSync(barrelPath, kept.join('\n'));
	return true;
}

function main() {
	const files = changedFiles();
	const summary = { prunedFiles: 0, prunedSpecifiers: 0, deletedFiles: 0, barrelsCleaned: 0 };
	const deletedAbsList = [];

	for (const rel of files) {
		const abs = join(ROOT, rel);
		if (!existsSync(abs)) continue;
		const src = readFileSync(abs, 'utf8');
		const pruned = pruneImports(src);
		let workSrc = pruned.src;

		if (fileIsDead(workSrc)) {
			summary.deletedFiles++;
			deletedAbsList.push(abs);
			if (flags.apply) unlinkSync(abs);
			console.error(`DELETE ${rel}`);
			continue;
		}

		if (pruned.changed) {
			summary.prunedFiles++;
			if (flags.apply) writeFileSync(abs, workSrc);
			console.error(`PRUNE  ${rel}`);
		}
	}

	for (const abs of deletedAbsList) {
		for (const barrel of siblingBarrels(abs)) {
			if (flags.apply) {
				if (removeSideEffectImport(barrel, abs)) {
					summary.barrelsCleaned++;
					console.error(`        - cleaned ${relative(ROOT, barrel)}`);
				}
			} else {
				// Dry-run: simulate
				const src = readFileSync(barrel, 'utf8');
				const baseNoExt = basename(abs).replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, '');
				if (new RegExp(`^\\s*import\\s+['"]\\.[\\w./-]*/${baseNoExt}['"]`, 'm').test(src) ||
					new RegExp(`^\\s*import\\s+['"]\\./${baseNoExt}['"]`, 'm').test(src)) {
					console.error(`        - would clean ${relative(ROOT, barrel)}`);
					summary.barrelsCleaned++;
				}
			}
		}
	}

	console.error('');
	console.error(`Pruned imports in ${summary.prunedFiles} files`);
	console.error(`Deleted ${summary.deletedFiles} dead files`);
	console.error(`Barrels cleaned: ${summary.barrelsCleaned}`);
	if (!flags.apply) console.error('Dry run only. Pass --apply to write changes.');
}

main();
