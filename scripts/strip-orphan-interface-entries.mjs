#!/usr/bin/env node
// For every orphan method we removed from `Meteor.methods({...})`, also drop
// its matching entry from the `declare module '@rocket.chat/ddp-client' {
// interface ServerMethods { ... } }` block in the same file. Leaving the
// interface entry around makes the type imports it references look used to
// TypeScript even though the implementation is gone — running the pruner
// would then have nothing to prune. This script + a re-run of the import
// pruner produces the consistent state.
//
// If the interface ServerMethods block becomes empty after the strip, the
// whole `declare module '@rocket.chat/ddp-client' { ... }` block is removed.
//
// Reads docs/ddp-audit.json on the current branch.
//
// Usage:
//   node scripts/strip-orphan-interface-entries.mjs --dry-run    # default
//   node scripts/strip-orphan-interface-entries.mjs --apply

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PLAN = join(ROOT, 'docs/ddp-orphan-removal-plan.json');
const argv = process.argv.slice(2);
const flags = { apply: argv.includes('--apply') };

function loadPlan() { return JSON.parse(readFileSync(PLAN, 'utf8')); }

// Find every `declare module '@rocket.chat/ddp-client' { ... interface
// ServerMethods { ... } ... }` block in the source.
function declareModuleBlocks(src) {
	const blocks = [];
	const re = /declare\s+module\s+(['"])@rocket\.chat\/ddp-client\1\s*\{/g;
	let m;
	while ((m = re.exec(src))) {
		const start = m.index;
		let i = m.index + m[0].length;
		let depth = 1;
		while (i < src.length && depth > 0) {
			const c = src[i];
			if (c === '/' && src[i + 1] === '/') {
				const nl = src.indexOf('\n', i);
				i = nl === -1 ? src.length : nl + 1;
				continue;
			}
			if (c === '/' && src[i + 1] === '*') {
				const end = src.indexOf('*/', i + 2);
				i = end === -1 ? src.length : end + 2;
				continue;
			}
			if (c === '"' || c === "'" || c === '`') {
				const q = c;
				i++;
				while (i < src.length) {
					if (src[i] === '\\') { i += 2; continue; }
					if (src[i] === q) { i++; break; }
					i++;
				}
				continue;
			}
			if (c === '{') depth++;
			else if (c === '}') depth--;
			i++;
		}
		blocks.push({ start, end: i });
		re.lastIndex = i;
	}
	return blocks;
}

// Within a declare-module block, locate the `interface ServerMethods { ... }`
// body span (inside the outer braces).
function serverMethodsInterfaceSpan(src, blockStart, blockEnd) {
	const re = /interface\s+ServerMethods\s*\{/g;
	re.lastIndex = blockStart;
	const m = re.exec(src);
	if (!m || m.index > blockEnd) return null;
	const bodyStart = m.index + m[0].length;
	let i = bodyStart;
	let depth = 1;
	while (i < blockEnd && depth > 0) {
		const c = src[i];
		if (c === '/' && src[i + 1] === '/') {
			const nl = src.indexOf('\n', i);
			i = nl === -1 ? blockEnd : nl + 1;
			continue;
		}
		if (c === '/' && src[i + 1] === '*') {
			const end = src.indexOf('*/', i + 2);
			i = end === -1 ? blockEnd : end + 2;
			continue;
		}
		if (c === '"' || c === "'" || c === '`') {
			const q = c;
			i++;
			while (i < blockEnd) {
				if (src[i] === '\\') { i += 2; continue; }
				if (src[i] === q) { i++; break; }
				i++;
			}
			continue;
		}
		if (c === '{') depth++;
		else if (c === '}') depth--;
		i++;
	}
	return { ifaceMatchStart: m.index, bodyStart, bodyEnd: i - 1, fullEnd: i };
}

// Inside `interface ServerMethods { ... }`, locate the entry for `method`.
// Returns the byte span covering: leading indent + JSDoc immediately above
// the entry + the entry itself + trailing newline.
function findInterfaceEntry(src, bodyStart, bodyEnd, method) {
	const escaped = method.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const patterns = [
		new RegExp(`^[\\t ]*['"]${escaped}['"]\\s*[:(?]`, 'm'),
		new RegExp(`^[\\t ]*${escaped}\\s*[:(?]`, 'm'),
	];
	const sub = src.slice(bodyStart, bodyEnd);
	for (const re of patterns) {
		const m = re.exec(sub);
		if (!m) continue;
		const entryStartLocal = m.index;
		let entryStart = bodyStart + entryStartLocal;
		// Roll back to the start of this entry's line.
		while (entryStart > bodyStart && src[entryStart - 1] !== '\n') entryStart--;
		// Also roll back over a JSDoc block that ends just before this entry.
		const beforeEntry = src.slice(bodyStart, entryStart).replace(/[ \t]+$/, '');
		const jsdocMatch = beforeEntry.match(/\/\*\*[\s\S]*?\*\/\s*$/);
		if (jsdocMatch) {
			const jsdocStartAbs = bodyStart + (beforeEntry.length - jsdocMatch[0].length);
			// Roll back to start of JSDoc's line.
			let s = jsdocStartAbs;
			while (s > bodyStart && src[s - 1] !== '\n') s--;
			entryStart = s;
		}
		// Walk forward to the end of this entry: find the closing `;` or end of
		// the method signature, then include the trailing newline.
		let i = bodyStart + entryStartLocal;
		// Skip past the opening of the signature (we don't know if it ends with `;`
		// after a multi-line method-type signature; track depth).
		let depth = 0;
		while (i < bodyEnd) {
			const c = src[i];
			if (c === '"' || c === "'" || c === '`') {
				const q = c;
				i++;
				while (i < bodyEnd) {
					if (src[i] === '\\') { i += 2; continue; }
					if (src[i] === q) { i++; break; }
					i++;
				}
				continue;
			}
			if (c === '(' || c === '{' || c === '<') depth++;
			else if (c === ')' || c === '}' || c === '>') depth--;
			if (depth === 0 && (c === ';' || c === ',')) { i++; break; }
			if (depth === 0 && c === '\n') {
				// Some signatures end at end of line without `;`.
				const tail = src.slice(i - 30, i);
				if (/[\w\]\)>]\s*$/.test(tail)) { i++; break; }
			}
			i++;
		}
		// Include trailing whitespace up to (and including) newline.
		while (i < bodyEnd && (src[i] === ' ' || src[i] === '\t')) i++;
		if (src[i] === '\n') i++;
		return { entryStart, entryEnd: i };
	}
	return null;
}

function bodyHasMembers(src, bodyStart, bodyEnd) {
	let i = bodyStart;
	while (i < bodyEnd) {
		const c = src[i];
		if (/\s/.test(c)) { i++; continue; }
		if (c === '/' && src[i + 1] === '/') { const nl = src.indexOf('\n', i); i = nl === -1 ? bodyEnd : nl + 1; continue; }
		if (c === '/' && src[i + 1] === '*') { const end = src.indexOf('*/', i + 2); i = end === -1 ? bodyEnd : end + 2; continue; }
		return true;
	}
	return false;
}

function main() {
	const plan = loadPlan();
	// Only strip interface entries for the methods we actually removed (per
	// the removal plan), not every orphan — methods on the skip-list are still
	// registered and their interface entries must stay.
	const restoreSet = new Set([
		// Methods restored after CI revealed dynamic callers — keep their
		// interfaces and implementations intact even if the plan listed them.
		'permissions/get',
		'rooms/get',
		'subscriptions/get',
		'public-settings/get',
		'private-settings/get',
		'samlLogout',
		'blockUser',
		'unblockUser',
	]);
	const orphanByFile = new Map();
	for (const entry of plan.perFile) {
		const fileAbs = join(ROOT, entry.file);
		const set = new Set(entry.removed.filter((m) => !restoreSet.has(m)));
		if (set.size > 0) orphanByFile.set(fileAbs, set);
	}

	const summary = { entriesRemoved: 0, declareBlocksRemoved: 0, files: 0, perFile: [] };

	for (const [fileAbs, names] of orphanByFile) {
		if (!existsSync(fileAbs)) continue;
		let src = readFileSync(fileAbs, 'utf8');
		const blocks = declareModuleBlocks(src).slice().sort((a, b) => b.start - a.start);
		const removedHere = [];

		for (const block of blocks) {
			const iface = serverMethodsInterfaceSpan(src, block.start, block.end);
			if (!iface) continue;
			// Remove orphan entries from this iface bottom-up.
			const orphanEntries = [];
			for (const name of names) {
				const entry = findInterfaceEntry(src, iface.bodyStart, iface.bodyEnd, name);
				if (entry) orphanEntries.push({ name, ...entry });
			}
			orphanEntries.sort((a, b) => b.entryStart - a.entryStart);
			for (const e of orphanEntries) {
				src = src.slice(0, e.entryStart) + src.slice(e.entryEnd);
				removedHere.push(e.name);
				summary.entriesRemoved++;
			}
			// Re-find block boundaries (offsets shifted) and check if iface is empty.
			const updatedBlocks = declareModuleBlocks(src);
			const stillThere = updatedBlocks.find((b) => Math.abs(b.start - block.start) < 300);
			if (!stillThere) continue;
			const ifaceNow = serverMethodsInterfaceSpan(src, stillThere.start, stillThere.end);
			if (ifaceNow && !bodyHasMembers(src, ifaceNow.bodyStart, ifaceNow.bodyEnd)) {
				// Drop the entire declare module block.
				let s = stillThere.start;
				while (s > 0 && src[s - 1] !== '\n') s--;
				let e = stillThere.end;
				while (e < src.length && (src[e] === ' ' || src[e] === '\t')) e++;
				if (src[e] === '\n') e++;
				src = src.slice(0, s) + src.slice(e);
				summary.declareBlocksRemoved++;
			}
		}

		if (removedHere.length === 0) continue;
		summary.files++;
		summary.perFile.push({ file: relative(ROOT, fileAbs), removed: removedHere });
		if (flags.apply) writeFileSync(fileAbs, src);
	}

	console.error(`Removed ${summary.entriesRemoved} interface entries across ${summary.files} files`);
	console.error(`declare-module blocks removed (now empty): ${summary.declareBlocksRemoved}`);
	for (const f of summary.perFile.slice(0, 30)) {
		console.error(`  ${f.file}`);
		for (const n of f.removed) console.error(`    - ${n}`);
	}
	if (summary.perFile.length > 30) console.error(`  ... and ${summary.perFile.length - 30} more`);
	if (!flags.apply) console.error('\nDry run only. Pass --apply to write changes.');
}

main();
