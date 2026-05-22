#!/usr/bin/env node
// Audit DDP methods: registrations vs callers vs REST replacements.
// Usage: node scripts/audit-ddp-methods.mjs [--json|--md] [--out PATH]
// Defaults: writes docs/ddp-audit.json and docs/ddp-audit.md.

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = [
	'apps/meteor/app',
	'apps/meteor/server',
	'apps/meteor/client',
	'apps/meteor/ee',
	'apps/meteor/imports',
	'apps/meteor/tests',
	'packages',
	'ee/packages',
	'ee/apps',
];
const EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const SKIP_DIR = /(^|\/)(node_modules|dist|build|\.next|coverage|\.turbo|public|\.meteor)(\/|$)/;

const REST_DIRS = [
	'apps/meteor/app/api/server/v1',
	'apps/meteor/ee/app/api/server',
	'apps/meteor/ee/server/api',
];

function walk(dir, out = []) {
	let entries;
	try { entries = readdirSync(dir); } catch { return out; }
	for (const name of entries) {
		const full = join(dir, name);
		if (SKIP_DIR.test(full)) continue;
		let st;
		try { st = statSync(full); } catch { continue; }
		if (st.isDirectory()) walk(full, out);
		else if (EXT.test(name)) out.push(full);
	}
	return out;
}

// Find Meteor.methods({...}) blocks with balanced-brace walker (handles strings/comments).
// Then extract top-level keys: 'name'(...) { } | "name"(...) | name(...) { } | name: ... | 'name': ...
function findMethodsBlocks(src) {
	const blocks = []; // {bodyStart, bodyEnd}
	const needle = 'Meteor.methods';
	let i = 0;
	while ((i = src.indexOf(needle, i)) !== -1) {
		let j = i + needle.length;
		while (j < src.length && /\s/.test(src[j])) j++;
		// Skip TS generic type parameter list, e.g. Meteor.methods<ServerMethods>(...)
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
		j++;
		while (j < src.length && /\s/.test(src[j])) j++;
		if (src[j] !== '{') { i = j; continue; }
		const bodyStart = j + 1;
		let depth = 1;
		let k = bodyStart;
		while (k < src.length && depth > 0) {
			const c = src[k];
			if (c === '/' && src[k + 1] === '/') { // line comment
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
				const quote = c;
				k++;
				while (k < src.length) {
					if (src[k] === '\\') { k += 2; continue; }
					if (src[k] === quote) { k++; break; }
					if (quote === '`' && src[k] === '$' && src[k + 1] === '{') {
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
		blocks.push({ bodyStart, bodyEnd: k - 1 });
		i = k;
	}
	return blocks;
}

// Walk body and yield top-level keys with their position.
function* extractTopLevelKeys(body) {
	let i = 0;
	let depth = 0;
	const RESERVED = new Set(['if', 'for', 'while', 'switch', 'return', 'const', 'let', 'var', 'function', 'await', 'async', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'typeof', 'instanceof', 'else', 'do', 'break', 'continue', 'default', 'case', 'in', 'of', 'void', 'delete', 'yield', 'with', 'export', 'import']);
	while (i < body.length) {
		const c = body[i];
		// Skip comments
		if (c === '/' && body[i + 1] === '/') {
			i = body.indexOf('\n', i);
			if (i === -1) return;
			continue;
		}
		if (c === '/' && body[i + 1] === '*') {
			const end = body.indexOf('*/', i + 2);
			i = end === -1 ? body.length : end + 2;
			continue;
		}
		// Skip strings
		if ((c === '"' || c === "'" || c === '`') && depth > 0) {
			const q = c;
			i++;
			while (i < body.length) {
				if (body[i] === '\\') { i += 2; continue; }
				if (body[i] === q) { i++; break; }
				i++;
			}
			continue;
		}
		// At depth 0, try to match a key at the start of a token
		if (depth === 0) {
			// Skip leading whitespace, commas, and comments.
			while (i < body.length) {
				if (/[\s,]/.test(body[i])) { i++; continue; }
				if (body[i] === '/' && body[i + 1] === '/') {
					const nl = body.indexOf('\n', i);
					i = nl === -1 ? body.length : nl;
					continue;
				}
				if (body[i] === '/' && body[i + 1] === '*') {
					const end = body.indexOf('*/', i + 2);
					i = end === -1 ? body.length : end + 2;
					continue;
				}
				break;
			}
			if (i >= body.length) break;
			let name = null;
			let nameStart = i;
			if (body[i] === '"' || body[i] === "'") {
				const q = body[i];
				const end = body.indexOf(q, i + 1);
				if (end !== -1) {
					name = body.slice(i + 1, end);
					i = end + 1;
				}
			} else if (/[A-Za-z_$]/.test(body[i])) {
				const m = body.slice(i).match(/^[A-Za-z_$][\w$]*/);
				if (m) { name = m[0]; i += m[0].length; }
			}
			if (name) {
				let p = i;
				while (p < body.length && /\s/.test(body[p])) p++;
				if (body[p] === '(' || body[p] === ':') {
					if (!RESERVED.has(name)) {
						yield { name, offset: nameStart };
					}
					// Skip the entire value of this entry so wrapper-call names like
					// `twoFactorRequired(async function...)` aren't treated as keys.
					let q = p;
					while (q < body.length) {
						const cq = body[q];
						if (cq === '/' && body[q + 1] === '/') {
							const nl = body.indexOf('\n', q);
							q = nl === -1 ? body.length : nl;
							continue;
						}
						if (cq === '/' && body[q + 1] === '*') {
							const end = body.indexOf('*/', q + 2);
							q = end === -1 ? body.length : end + 2;
							continue;
						}
						if (cq === '"' || cq === "'" || cq === '`') {
							const qq = cq;
							q++;
							while (q < body.length) {
								if (body[q] === '\\') { q += 2; continue; }
								if (body[q] === qq) { q++; break; }
								if (qq === '`' && body[q] === '$' && body[q + 1] === '{') {
									q += 2;
									let td = 1;
									while (q < body.length && td > 0) {
										if (body[q] === '{') td++;
										else if (body[q] === '}') td--;
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
							while (q < body.length && pd > 0) {
								const cc2 = body[q];
								if (cc2 === '"' || cc2 === "'" || cc2 === '`') {
									const qq = cc2;
									q++;
									while (q < body.length) {
										if (body[q] === '\\') { q += 2; continue; }
										if (body[q] === qq) { q++; break; }
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
						if (cq === '}') break; // end of methods block
						q++;
					}
					i = q;
					continue;
				}
			}
		}
		if (i >= body.length) break;
		const cc = body[i];
		if (cc === '{') depth++;
		else if (cc === '}') depth--;
		i++;
	}
}

function extractRegistrations(files) {
	const regs = [];
	for (const file of files) {
		let src;
		try { src = readFileSync(file, 'utf8'); } catch { continue; }
		if (!src.includes('Meteor.methods')) continue;
		const blocks = findMethodsBlocks(src);
		for (const { bodyStart, bodyEnd } of blocks) {
			const body = src.slice(bodyStart, bodyEnd);
			for (const { name, offset } of extractTopLevelKeys(body)) {
				const absOffset = bodyStart + offset;
				const line = src.slice(0, absOffset).split('\n').length;
				regs.push({ method: name, file: relative(ROOT, file), line });
			}
		}
	}
	const seen = new Map();
	for (const r of regs) {
		const k = `${r.method}::${r.file}`;
		if (!seen.has(k)) seen.set(k, r);
	}
	return [...seen.values()];
}

// Caller patterns. Each captures the method name literal.
const CALLER_PATTERNS = [
	{ kind: 'Meteor.call', re: /Meteor\.(?:call|callAsync|apply|applyAsync)\s*\(\s*(['"])([^'"]+)\1/g },
	{ kind: 'sdk.call', re: /\bsdk\.(?:call|callAsync)\s*\(\s*(['"])([^'"]+)\1/g },
	{ kind: 'useMethod', re: /\buseMethod\s*\(\s*(['"])([^'"]+)\1/g },
	{ kind: 'callWithErrorHandling', re: /callWithErrorHandling(?:TOTP)?\s*\(\s*(['"])([^'"]+)\1/g },
	{ kind: 'callAsyncWithTimeout', re: /\bcallAsync(?:WithTimeout)?\s*\(\s*(['"])([^'"]+)\1/g },
];

function extractCallers(files) {
	const callers = new Map(); // method -> [{file,line,kind}]
	for (const file of files) {
		let src;
		try { src = readFileSync(file, 'utf8'); } catch { continue; }
		for (const { kind, re } of CALLER_PATTERNS) {
			re.lastIndex = 0;
			let m;
			while ((m = re.exec(src))) {
				const name = m[2];
				const line = src.slice(0, m.index).split('\n').length;
				if (!callers.has(name)) callers.set(name, []);
				callers.get(name).push({ file: relative(ROOT, file), line, kind });
			}
		}
	}
	return callers;
}

// REST endpoints: capture path literals after API.v1.<method>( or API.v1.addRoute(
// Also chained: `.get('path',` / `.post('path',` if previous chain root contains API.v1
const REST_RE = /(?:API\.v1\s*\.|^\s*\.)(?:addRoute|get|post|put|delete|patch)\s*\(\s*(['"`])([^'"`]+)\1/gm;

function extractRestRoutes() {
	const routes = new Set();
	for (const sub of REST_DIRS) {
		const files = walk(join(ROOT, sub));
		for (const file of files) {
			let src;
			try { src = readFileSync(file, 'utf8'); } catch { continue; }
			if (!src.includes('API.v1') && !src.includes('.post(') && !src.includes('.get(')) continue;
			REST_RE.lastIndex = 0;
			let m;
			while ((m = REST_RE.exec(src))) {
				routes.add(m[2]);
			}
		}
	}
	return routes;
}

// DDP methods whose REST "equivalents" are misleading: the endpoint either
// has materially different semantics, a different param shape, or simply
// doesn't exist. These methods are forced to have no REST replacement so the
// deprecation logger only reports the version, not a wrong URL.
const REST_DENYLIST = new Set([
	// WRONG endpoints (different feature or action)
	'2fa:enable',                 // TOTP enable vs email-2fa-enable
	'2fa:disable',                // TOTP disable vs sending an email code
	'deleteFileMessage',          // single-message delete vs rooms.cleanHistory range purge
	'getMessages',                // batched ids vs single getMessage
	'loadNextMessages',           // forward fetch vs syncMessages delta
	'loadSurroundingMessages',    // before+after vs syncMessages delta
	'readThreads',                // tmid read-marker vs whole-room read
	'getSetupWizardParameters',   // wizard-flagged subset vs settings.public
	'banner/dismiss',             // user-doc set vs Banner.dismiss broadcast
	// MISSING (no real endpoint at the heuristic-derived path)
	'saveSettings',               // /v1/settings does not exist; only settings/:_id
	// PARTIAL with silent-break risk (channels-only when DDP was room-agnostic,
	// or shape so different that a caller cannot drop-in swap)
	'loadHistory',
	'loadMissedMessages',
	'joinRoom',
	'leaveRoom',
	'addUsersToRoom',
	'getRoomByTypeAndName',
	'spotlight',
	'slashCommand',
]);

// Heuristic mapping: DDP method name → candidate REST paths to check.
// If any candidate exists in REST set, method is considered to have replacement.
function candidateRoutes(method) {
	if (REST_DENYLIST.has(method)) return [];
	const out = new Set();
	out.add(method); // exact match (e.g. spotlight, banners.dismiss)
	// "verb:thing" -> "thing.verb"
	if (method.includes(':')) {
		const [a, b] = method.split(':', 2);
		out.add(`${a}.${b}`);
		out.add(`${b}.${a}`);
	}
	// "namespace.action" with case insensitivity and `/` separator form.
	if (method.includes('.')) {
		out.add(method.replace('.', '/'));
		out.add(method.toLowerCase());
	}
	if (method.includes('/')) {
		out.add(method.replace('/', '.'));
	}
	// Special cases (verified mappings only).
	const map = {
		sendMessage: ['chat.sendMessage'],
		updateMessage: ['chat.update'],
		getSingleMessage: ['chat.getMessage'],
		getThreadMessages: ['chat.getThreadMessages'],
		createChannel: ['channels.create'],
		createPrivateGroup: ['groups.create'],
		createDirectMessage: ['im.create', 'dm.create'],
		createDiscussion: ['rooms.createDiscussion'],
		archiveRoom: ['channels.archive', 'groups.archive'],
		unarchiveRoom: ['channels.unarchive', 'groups.unarchive'],
		hideRoom: ['rooms.leave'],
		registerUser: ['users.register'],
		setAvatarFromService: ['users.setAvatar'],
		setUserStatus: ['users.setStatus'],
		requestDataDownload: ['users.requestDataDownload'],
		getRoomById: ['rooms.info'],
		getRoomNameById: ['rooms.info'],
		saveSetting: ['settings/:_id'],
		saveRoomSettings: ['rooms.saveRoomSettings'],
		executeSlashCommandPreview: ['commands.preview'],
		getSlashCommandPreviews: ['commands.preview'],
		listCustomUserStatus: ['custom-user-status.list'],
		pinMessage: ['chat.pinMessage'],
		unpinMessage: ['chat.unPinMessage'],
		starMessage: ['chat.starMessage'],
		followMessage: ['chat.followMessage'],
		unfollowMessage: ['chat.unfollowMessage'],
		messageSearch: ['chat.search'],
		readMessages: ['subscriptions.read'],
		unreadMessages: ['subscriptions.unread'],
		toggleFavorite: ['rooms.favorite'],
		blockUser: ['users.block'],
		unblockUser: ['users.unblock'],
		ignoreUser: ['chat.ignoreUser'],
		'license:getModules': ['licenses.info', 'licenses.get'],
		'license:isEnterprise': ['licenses.isEnterprise'],
		'personalAccessTokens:generateToken': ['users.generatePersonalAccessToken'],
		'personalAccessTokens:regenerateToken': ['users.regeneratePersonalAccessToken'],
		'personalAccessTokens:removeToken': ['users.removePersonalAccessToken'],
		deleteUser: ['users.delete'],
		deleteUserOwnAccount: ['users.deleteOwnAccount'],
		setUserActiveStatus: ['users.setActiveStatus'],
		setEmail: ['users.update'],
		setRealName: ['users.update'],
		resetAvatar: ['users.resetAvatar'],
		removeUserFromRoom: ['channels.kick', 'groups.kick'],
		cleanRoomHistory: ['rooms.cleanHistory'],
		channelsList: ['channels.list'],
		getUsersOfRoom: ['channels.members', 'groups.members'],
		getThreadsList: ['chat.getThreadsList'],
		getChannelHistory: ['channels.history'],
		getUserMentionsByChannel: ['channels.getAllUserMentionsByChannel'],
		getStatistics: ['statistics'],
		'autoTranslate.getSupportedLanguages': ['autotranslate.getSupportedLanguages'],
		'autoTranslate.translateMessage': ['autotranslate.translateMessage'],
		'subscriptions/get': ['subscriptions.get'],
		getReadReceipts: ['chat.getMessageReadReceipts'],
	};
	if (map[method]) for (const r of map[method]) out.add(r);
	return [...out];
}

function main() {
	const argv = process.argv.slice(2);
	const want = {
		json: argv.includes('--json'),
		md: argv.includes('--md'),
		quiet: argv.includes('--quiet'),
	};
	if (!want.json && !want.md) { want.json = true; want.md = true; }
	const outIdx = argv.indexOf('--out');
	const outDir = outIdx >= 0 ? argv[outIdx + 1] : join(ROOT, 'docs');

	if (!want.quiet) console.error('Scanning files...');
	const allFiles = SCAN_DIRS.flatMap(d => walk(join(ROOT, d)));
	if (!want.quiet) console.error(`  ${allFiles.length} files`);

	if (!want.quiet) console.error('Extracting Meteor.methods registrations...');
	const regs = extractRegistrations(allFiles);
	if (!want.quiet) console.error(`  ${regs.length} method registrations`);

	if (!want.quiet) console.error('Extracting callers...');
	const callers = extractCallers(allFiles);
	if (!want.quiet) console.error(`  ${callers.size} distinct method names referenced`);

	if (!want.quiet) console.error('Extracting REST routes...');
	const restRoutes = extractRestRoutes();
	if (!want.quiet) console.error(`  ${restRoutes.size} REST routes`);

	const methodNames = [...new Set(regs.map(r => r.method))].sort();
	const used = [];
	const orphans = [];
	const noRest = [];

	for (const name of methodNames) {
		const regsForMethod = regs.filter(r => r.method === name);
		const callsForMethod = (callers.get(name) || []).filter(c => {
			// Exclude self-references inside the registration file itself? Keep for now.
			return !regsForMethod.some(r => r.file === c.file && Math.abs(r.line - c.line) < 3);
		});
		const candidates = candidateRoutes(name);
		const restMatch = candidates.find(c => restRoutes.has(c));
		const record = {
			method: name,
			registrations: regsForMethod,
			callers: callsForMethod,
			callerCount: callsForMethod.length,
			restReplacement: restMatch || null,
		};
		if (callsForMethod.length === 0) orphans.push(record);
		else {
			used.push(record);
			if (!restMatch) noRest.push(record);
		}
	}

	const result = {
		generatedAt: new Date().toISOString(),
		totals: {
			registered: methodNames.length,
			used: used.length,
			orphans: orphans.length,
			usedWithoutRest: noRest.length,
			restRoutes: restRoutes.size,
		},
		used,
		orphans,
		usedWithoutRest: noRest,
	};

	mkdirSync(outDir, { recursive: true });

	if (want.json) {
		const p = join(outDir, 'ddp-audit.json');
		writeFileSync(p, JSON.stringify(result, null, 2));
		if (!want.quiet) console.error(`Wrote ${relative(ROOT, p)}`);
	}
	if (want.md) {
		const p = join(outDir, 'ddp-audit.md');
		writeFileSync(p, renderMarkdown(result));
		if (!want.quiet) console.error(`Wrote ${relative(ROOT, p)}`);
	}

	if (!want.quiet) {
		console.error('');
		console.error(`Totals: ${result.totals.registered} registered | ${result.totals.used} used | ${result.totals.orphans} orphans | ${result.totals.usedWithoutRest} used-without-rest`);
	}
}

function renderMarkdown(r) {
	const out = [];
	out.push(`# DDP Methods Audit`);
	out.push(``);
	out.push(`Generated: ${r.generatedAt}`);
	out.push(``);
	out.push(`| metric | count |`);
	out.push(`|---|---|`);
	out.push(`| Registered methods | ${r.totals.registered} |`);
	out.push(`| Used (has caller) | ${r.totals.used} |`);
	out.push(`| Orphans (no caller) | ${r.totals.orphans} |`);
	out.push(`| Used without REST replacement | ${r.totals.usedWithoutRest} |`);
	out.push(`| REST routes scanned | ${r.totals.restRoutes} |`);
	out.push(``);
	out.push(`## 1. Used methods (${r.used.length})`);
	out.push(``);
	out.push(`| method | registration | callers | REST replacement |`);
	out.push(`|---|---|---|---|`);
	for (const m of r.used.slice().sort((a, b) => b.callerCount - a.callerCount)) {
		const reg = m.registrations.map(x => `${x.file}:${x.line}`).join('<br>');
		const rest = m.restReplacement ? `\`${m.restReplacement}\`` : '— none —';
		out.push(`| \`${m.method}\` | ${reg} | ${m.callerCount} | ${rest} |`);
	}
	out.push(``);
	out.push(`## 2. Orphan methods — no caller found (${r.orphans.length})`);
	out.push(``);
	out.push(`> ⚠️ Detection matches only literal method-name strings. Methods called via dynamic variables (e.g. \`useMethod(value)\` in admin \`MethodActionInput.tsx\`) or via the \`/v1/method.call/:method\` REST proxy will appear orphan.`);
	out.push(``);
	out.push(`| method | registration |`);
	out.push(`|---|---|`);
	for (const m of r.orphans) {
		const reg = m.registrations.map(x => `${x.file}:${x.line}`).join('<br>');
		out.push(`| \`${m.method}\` | ${reg} |`);
	}
	out.push(``);
	out.push(`## 3. Used methods without REST replacement (${r.usedWithoutRest.length})`);
	out.push(``);
	out.push(`| method | registration | callers |`);
	out.push(`|---|---|---|`);
	for (const m of r.usedWithoutRest) {
		const reg = m.registrations.map(x => `${x.file}:${x.line}`).join('<br>');
		out.push(`| \`${m.method}\` | ${reg} | ${m.callerCount} |`);
	}
	out.push(``);
	return out.join('\n');
}

main();
