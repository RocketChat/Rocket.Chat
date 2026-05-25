#!/usr/bin/env node
// Remove orphan Meteor methods (no callers found) from each file's
// `Meteor.methods({ ... })` registration block. When the block becomes empty,
// remove the entire `Meteor.methods<...>({})` statement.
//
// Does NOT touch the `declare module '@rocket.chat/ddp-client' { interface
// ServerMethods { ... } }` blocks, nor unused imports — run eslint --fix
// afterwards to clean those up.
//
// Usage:
//   node scripts/remove-orphan-ddp-methods.mjs --dry-run    # default
//   node scripts/remove-orphan-ddp-methods.mjs --apply
//   node scripts/remove-orphan-ddp-methods.mjs --only 'name1,name2'
//   node scripts/remove-orphan-ddp-methods.mjs --limit 5

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIT = join(ROOT, 'docs/ddp-audit.json');

const argv = process.argv.slice(2);
const flags = {
	apply: argv.includes('--apply'),
	limit: (() => {
		const i = argv.indexOf('--limit');
		return i >= 0 ? Number(argv[i + 1]) : Infinity;
	})(),
	only: (() => {
		const i = argv.indexOf('--only');
		return i >= 0 ? new Set(argv[i + 1].split(',').map((s) => s.trim())) : null;
	})(),
};

// Skip-list: methods we intentionally do NOT remove yet (still reachable via
// admin MethodActionInput dynamic dispatch, or known-needed by external/mobile
// clients). Adjust as we get confirmation from owners.
const NEVER_REMOVE = new Set([
	// admin "method-action" buttons in settings UI
	'OEmbedCacheCleanup',
	'restart_server',
	'push_test',
	'crowd_sync_users',
	'crowd_test_connection',
	'loadLocale',
	'resetIrcConnection',
	'checkFederationConfiguration',
	'removeSlackBridgeChannelLinks',
	'cloud:checkRegisterStatus',
	'cloud:registerWorkspace',
	'cloud:checkUserLoggedIn',
	'cloud:logout',
	'cloud:finishOAuthAuthorization',
	'cloud:getOAuthAuthorizationUrl',
	// Wired into Meteor accounts via Accounts.forgotPassword on the client —
	// the audit's static scan can't see that chain.
	'sendForgotPasswordEmail',
]);

function loadAudit() {
	return JSON.parse(readFileSync(AUDIT, 'utf8'));
}

// Locate every Meteor.methods({...}) body span in the source, with balanced
// brace tracking that respects strings and comments.
function findMethodsBlocks(src) {
	const blocks = [];
	const needle = 'Meteor.methods';
	let i = 0;
	while ((i = src.indexOf(needle, i)) !== -1) {
		let j = i + needle.length;
		while (j < src.length && /\s/.test(src[j])) j++;
		// Skip TS generic parameter list e.g. Meteor.methods<ServerMethods>(...).
		if (src[j] === '<') {
			let td = 1;
			j++;
			while (j < src.length && td > 0) {
				if (src[j] === '<') td++;
				else if (src[j] === '>') td--;
				j++;
			}
			while (j < src.length && /\s/.test(src[j])) j++;
		}
		if (src[j] !== '(') { i = j + 1; continue; }
		const callOpen = j;
		j++;
		while (j < src.length && /\s/.test(src[j])) j++;
		if (src[j] !== '{') { i = j; continue; }
		const bodyStart = j + 1;
		let depth = 1;
		let k = bodyStart;
		while (k < src.length && depth > 0) {
			const c = src[k];
			if (c === '/' && src[k + 1] === '/') {
				k = src.indexOf('\n', k);
				if (k === -1) k = src.length;
				continue;
			}
			if (c === '/' && src[k + 1] === '*') {
				const end = src.indexOf('*/', k + 2);
				k = end === -1 ? src.length : end + 2;
				continue;
			}
			if (c === '"' || c === "'" || c === '`') {
				const q = c;
				k++;
				while (k < src.length) {
					if (src[k] === '\\') { k += 2; continue; }
					if (src[k] === q) { k++; break; }
					if (q === '`' && src[k] === '$' && src[k + 1] === '{') {
						k += 2;
						let td = 1;
						while (k < src.length && td > 0) {
							if (src[k] === '{') td++;
							else if (src[k] === '}') td--;
							k++;
						}
						continue;
					}
					k++;
				}
				continue;
			}
			if (c === '{') depth++;
			else if (c === '}') depth--;
			k++;
		}
		const bodyEnd = k - 1;
		// Walk forward past closing `}` and `)` to capture the statement end.
		let stmtEnd = k;
		while (stmtEnd < src.length && /\s/.test(src[stmtEnd])) stmtEnd++;
		if (src[stmtEnd] === ')') stmtEnd++;
		if (src[stmtEnd] === ';') stmtEnd++;
		// Include trailing newline so removal doesn't leave a blank line.
		while (stmtEnd < src.length && (src[stmtEnd] === ' ' || src[stmtEnd] === '\t')) stmtEnd++;
		if (src[stmtEnd] === '\n') stmtEnd++;
		blocks.push({ stmtStart: i, callOpen, bodyStart, bodyEnd, stmtEnd });
		i = stmtEnd;
	}
	return blocks;
}

// Return list of { name, keyStart, keyEnd, entryStart, entryEnd } for each
// top-level entry in the body span. entryStart/entryEnd cover the entry
// including trailing comma + newline so removal is clean.
function listEntries(src, bodyStart, bodyEnd) {
	const RESERVED = new Set(['if', 'for', 'while', 'switch', 'return', 'const', 'let', 'var', 'function', 'await', 'async', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'typeof', 'instanceof', 'else', 'do', 'break', 'continue', 'default', 'case', 'in', 'of', 'void', 'delete', 'yield', 'with', 'export', 'import']);
	const out = [];
	let i = bodyStart;
	let depth = 0;
	while (i < bodyEnd) {
		// Skip comments at top-level
		if (depth === 0) {
			if (src[i] === '/' && src[i + 1] === '/') {
				const nl = src.indexOf('\n', i);
				i = nl === -1 ? bodyEnd : nl + 1;
				continue;
			}
			if (src[i] === '/' && src[i + 1] === '*') {
				const end = src.indexOf('*/', i + 2);
				i = end === -1 ? bodyEnd : end + 2;
				continue;
			}
		}
		const c = src[i];
		if ((c === '"' || c === "'" || c === '`') && depth > 0) {
			const q = c;
			i++;
			while (i < bodyEnd) {
				if (src[i] === '\\') { i += 2; continue; }
				if (src[i] === q) { i++; break; }
				i++;
			}
			continue;
		}
		if (depth === 0) {
			// At top level, attempt to read an entry. Skip whitespace, commas, and
			// comments. Also skip a leading `async` keyword that may precede the
			// method key.
			while (i < bodyEnd) {
				if (/[\s,]/.test(src[i])) { i++; continue; }
				if (src[i] === '/' && src[i + 1] === '/') {
					const nl = src.indexOf('\n', i);
					i = nl === -1 ? bodyEnd : nl;
					continue;
				}
				if (src[i] === '/' && src[i + 1] === '*') {
					const end = src.indexOf('*/', i + 2);
					i = end === -1 ? bodyEnd : end + 2;
					continue;
				}
				if (src.slice(i, i + 5) === 'async' && /\s/.test(src[i + 5] || '')) {
					i += 5;
					continue;
				}
				break;
			}
			if (i >= bodyEnd) break;
			const entryStart = (() => {
				// Walk back to the start of this entry's line so removal also drops
				// leading indent and any `async` modifier that lives on the same line.
				let s = i;
				while (s > bodyStart && src[s - 1] !== '\n') s--;
				return s;
			})();
			let name = null;
			let nameStart = i;
			if (src[i] === '"' || src[i] === "'") {
				const q = src[i];
				const end = src.indexOf(q, i + 1);
				if (end !== -1) { name = src.slice(i + 1, end); i = end + 1; }
			} else if (/[A-Za-z_$]/.test(src[i])) {
				const m = src.slice(i, Math.min(bodyEnd, i + 200)).match(/^[A-Za-z_$][\w$]*/);
				if (m) { name = m[0]; i += m[0].length; }
			}
			if (name && !RESERVED.has(name)) {
				let p = i;
				while (p < bodyEnd && /\s/.test(src[p])) p++;
				if (src[p] === '(' || src[p] === ':') {
					// Advance i past the value of this entry to find entryEnd.
					let q = p;
					while (q < bodyEnd) {
						const cq = src[q];
						if (cq === '/' && src[q + 1] === '/') {
							const nl = src.indexOf('\n', q);
							q = nl === -1 ? bodyEnd : nl;
							continue;
						}
						if (cq === '/' && src[q + 1] === '*') {
							const end = src.indexOf('*/', q + 2);
							q = end === -1 ? bodyEnd : end + 2;
							continue;
						}
						if (cq === '"' || cq === "'" || cq === '`') {
							const qq = cq;
							q++;
							while (q < bodyEnd) {
								if (src[q] === '\\') { q += 2; continue; }
								if (src[q] === qq) { q++; break; }
								if (qq === '`' && src[q] === '$' && src[q + 1] === '{') {
									q += 2;
									let td = 1;
									while (q < bodyEnd && td > 0) {
										if (src[q] === '{') td++;
										else if (src[q] === '}') td--;
										q++;
									}
									continue;
								}
								q++;
							}
							continue;
						}
						if (cq === '(' || cq === '{' || cq === '[') {
							const open = cq;
							const close = cq === '(' ? ')' : cq === '{' ? '}' : ']';
							let pd = 1;
							q++;
							while (q < bodyEnd && pd > 0) {
								const cc2 = src[q];
								if (cc2 === '"' || cc2 === "'" || cc2 === '`') {
									const qq = cc2;
									q++;
									while (q < bodyEnd) {
										if (src[q] === '\\') { q += 2; continue; }
										if (src[q] === qq) { q++; break; }
										q++;
									}
									continue;
								}
								if (cc2 === open) pd++;
								else if (cc2 === close) pd--;
								q++;
							}
							continue;
						}
						if (cq === ',') { q++; break; }
						if (cq === '}') break;
						q++;
					}
					// Roll forward past trailing whitespace/newline so removal is clean.
					let entryEnd = q;
					while (entryEnd < bodyEnd && (src[entryEnd] === ' ' || src[entryEnd] === '\t')) entryEnd++;
					if (src[entryEnd] === '\n') entryEnd++;
					out.push({ name, nameStart, entryStart, entryEnd });
					i = entryEnd;
					continue;
				}
			}
		}
		if (i >= bodyEnd) break;
		const cc = src[i];
		if (cc === '{') depth++;
		else if (cc === '}') depth--;
		i++;
	}
	return out;
}

function bodyIsEmpty(src, bodyStart, bodyEnd) {
	let i = bodyStart;
	while (i < bodyEnd) {
		const c = src[i];
		if (/\s/.test(c)) { i++; continue; }
		if (c === '/' && src[i + 1] === '/') {
			const nl = src.indexOf('\n', i);
			i = nl === -1 ? bodyEnd : nl + 1;
			continue;
		}
		if (c === '/' && src[i + 1] === '*') {
			const end = src.indexOf('*/', i + 2);
			i = end === -1 ? bodyEnd : end + 2;
			continue;
		}
		return false;
	}
	return true;
}

function main() {
	const audit = loadAudit();
	const orphanNames = new Set(audit.orphans.map((o) => o.method));

	// Apply skip-list and --only filter.
	const targetNames = new Set(
		[...orphanNames].filter((n) => !NEVER_REMOVE.has(n) && (!flags.only || flags.only.has(n))),
	);
	let limit = flags.limit;

	const byFile = new Map();
	for (const o of audit.orphans) {
		if (!targetNames.has(o.method)) continue;
		if (limit-- <= 0) break;
		for (const reg of o.registrations) {
			const fileAbs = join(ROOT, reg.file);
			if (!byFile.has(fileAbs)) byFile.set(fileAbs, new Set());
			byFile.get(fileAbs).add(o.method);
		}
	}

	const summary = { files: 0, methodsRemoved: 0, blocksEmptied: 0, missing: [], perFile: [] };

	for (const [fileAbs, names] of byFile) {
		let src;
		try { src = readFileSync(fileAbs, 'utf8'); } catch {
			console.error(`SKIP (read failed): ${relative(ROOT, fileAbs)}`);
			continue;
		}

		const blocks = findMethodsBlocks(src);
		// Process blocks bottom-up.
		blocks.sort((a, b) => b.stmtStart - a.stmtStart);
		let removedHere = 0;
		const removedNames = [];
		let emptiedHere = 0;

		for (const block of blocks) {
			const entries = listEntries(src, block.bodyStart, block.bodyEnd);
			const toRemove = entries.filter((e) => names.has(e.name));
			if (toRemove.length === 0) continue;
			// Remove entries bottom-up.
			toRemove.sort((a, b) => b.entryStart - a.entryStart);
			let newSrc = src;
			for (const e of toRemove) {
				newSrc = newSrc.slice(0, e.entryStart) + newSrc.slice(e.entryEnd);
				removedHere++;
				removedNames.push(e.name);
			}
			// Re-locate this block in newSrc by scanning from old stmtStart.
			const updatedBlocks = findMethodsBlocks(newSrc);
			const stillThere = updatedBlocks.find((b) => Math.abs(b.stmtStart - block.stmtStart) < 200);
			if (stillThere && bodyIsEmpty(newSrc, stillThere.bodyStart, stillThere.bodyEnd)) {
				newSrc = newSrc.slice(0, stillThere.stmtStart) + newSrc.slice(stillThere.stmtEnd);
				emptiedHere++;
			}
			src = newSrc;
		}

		const requested = [...names];
		const missed = requested.filter((n) => !removedNames.includes(n));
		for (const m of missed) summary.missing.push({ file: relative(ROOT, fileAbs), method: m });

		if (removedHere === 0) continue;

		summary.files++;
		summary.methodsRemoved += removedHere;
		summary.blocksEmptied += emptiedHere;
		summary.perFile.push({
			file: relative(ROOT, fileAbs),
			removed: removedNames,
			emptied: emptiedHere,
		});

		if (flags.apply) writeFileSync(fileAbs, src);
	}

	console.error('');
	console.error(`Removed ${summary.methodsRemoved} method registrations across ${summary.files} files`);
	console.error(`Blocks emptied: ${summary.blocksEmptied}`);
	if (summary.missing.length) {
		console.error(`Missing (could not locate): ${summary.missing.length}`);
		for (const m of summary.missing.slice(0, 10)) console.error(`  ${m.file} :: ${m.method}`);
	}
	console.error('');

	for (const f of summary.perFile.slice(0, 25)) {
		console.error(`  ${f.file}${f.emptied ? ' [block emptied]' : ''}`);
		for (const n of f.removed) console.error(`    - ${n}`);
	}
	if (summary.perFile.length > 25) console.error(`  ... and ${summary.perFile.length - 25} more files`);

	if (!flags.apply) {
		console.error('');
		console.error('Dry run. Pass --apply to write changes.');
	}

	const planPath = join(ROOT, 'docs/ddp-orphan-removal-plan.json');
	writeFileSync(planPath, JSON.stringify(summary, null, 2));
	console.error(`Plan saved: ${relative(ROOT, planPath)}`);
}

main();
