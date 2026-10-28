// Browser driver for the E2EE search browser backend. run.mjs starts one driver per browser.
// Usage: node driver.mjs <chrome|firefox|safari>
// Serves a self-driving test page on 127.0.0.1, opens it in the real browser, and runs ports of the checks in
// apps/meteor/tests/e2ee-search-browser/*.pw.ts through a long-poll RPC. Writes out/results-<browser>.json.
// Exits 0 only when every check passes.
import { spawn, execFileSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as P from './probes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const METEOR = resolve(HERE, '../../..');
const OUT = join(HERE, 'out');
const PUBLIC = join(METEOR, 'public/workers/e2ee-search');
const require = createRequire(join(METEOR, 'package.json'));
const { build } = require('esbuild');
const { expect } = require('expect');

const browserName = process.argv[2];
if (!['chrome', 'firefox', 'safari'].includes(browserName)) throw new Error('usage: node driver.mjs <chrome|firefox|safari>');
const BINARIES = {
	chrome: process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
	firefox: process.env.FIREFOX_BIN ?? '/Applications/Firefox.app/Contents/MacOS/firefox',
};
if (BINARIES[browserName] && !existsSync(BINARIES[browserName])) {
	throw new Error(`${browserName} not found at ${BINARIES[browserName]}. Set ${browserName === 'chrome' ? 'CHROME_BIN' : 'FIREFOX_BIN'}.`);
}
// WebDriver helpers for real Safari through safaridriver.
let wd; // { base, sid }
let safariTransport; // 'safaridriver' or 'open -g'
const report = { browser: browserName, startedAt: new Date().toISOString(), capabilities: {}, tests: [], notes: [] };
const tabHandles = {};
const wdCall = async (method, path, body) => {
	const response = await fetch(`${wd.base}${path}`, {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: body ? JSON.stringify(body) : undefined,
	});
	const json = await response.json();
	if (!response.ok) throw new Error(`WebDriver ${method} ${path}: ${JSON.stringify(json.value).slice(0, 300)}`);
	return json.value;
};

mkdirSync(OUT, { recursive: true });
await build({ entryPoints: [join(HERE, 'matrixEntry.ts')], bundle: true, format: 'esm', outfile: join(OUT, 'page.js'), logLevel: 'error' });
await build({
	entryPoints: [join(METEOR, 'client/lib/e2eeSearch/searchIndexBackendContract.ts')],
	bundle: true,
	format: 'esm',
	platform: 'node',
	outfile: join(OUT, 'contract.mjs'),
	logLevel: 'error',
});
const { describeSearchIndexBackendContract } = await import(join(OUT, 'contract.mjs'));

// ---------------------------------------------------------------- server + RPC
const TYPES = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.mjs': 'text/javascript',
	'.wasm': 'application/wasm',
	'.map': 'application/json',
};
const TEST_MODULES = {
	'/test/refuse-storage.mjs':
		"StorageManager.prototype.getDirectory = () => Promise.reject(new DOMException('The storage is refused', 'SecurityError'));",
	'/test/refused-storage-worker.mjs': "import './refuse-storage.mjs';\nimport '../workers/e2ee-search/worker.mjs';",
	// The product worker URL serves a wrapper: a console shim first, then the unchanged product worker.
	'/workers/e2ee-search/worker.mjs': "import './log-shim.mjs';\nimport './worker-real.mjs';",
	'/workers/e2ee-search/log-shim.mjs': `for (const level of ['log', 'info', 'warn', 'error']) {
	const original = console[level].bind(console);
	console[level] = (...args) => {
		try { self.postMessage({ id: -1, __log: level + ': ' + args.map((a) => (typeof a === 'string' ? a : a instanceof Error ? a.name + ': ' + a.message : JSON.stringify(a))).join(' ') }); } catch {}
		original(...args);
	};
}
self.addEventListener('unhandledrejection', (e) => { try { self.postMessage({ id: -1, __log: 'unhandledrejection: ' + (e.reason?.message ?? e.reason) }); } catch {} });`,
};
const fileFor = (path) => {
	if (path === '/page.js') return join(OUT, 'page.js');
	if (path === '/probe/worker.mjs') return join(HERE, 'probe-worker.mjs');
	if (path === '/workers/e2ee-search/worker-real.mjs') return join(PUBLIC, 'worker.mjs');
	if (path.startsWith('/workers/e2ee-search/')) return join(PUBLIC, path.slice('/workers/e2ee-search/'.length));
	return undefined;
};

const queues = new Map(); // tab -> commands waiting
const waiters = new Map(); // tab -> long-poll response
const results = new Map(); // cid -> {resolve}
const hellos = new Map(); // tab -> resolve
const helloInfo = {};
const closeFailed = new Set();
let nextCid = 0;

const readBody = (request) =>
	new Promise((resolve) => {
		let data = '';
		request.on('data', (chunk) => {
			data += chunk;
		});
		request.on('end', () => resolve(data ? JSON.parse(data) : {}));
	});

const deliver = (tab) => {
	const waiter = waiters.get(tab);
	const queue = queues.get(tab) ?? [];
	if (!waiter || queue.length === 0) return;
	waiters.delete(tab);
	clearTimeout(waiter.timer);
	waiter.response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(queue.shift()));
};

const server = createServer(async (request, response) => {
	const url = new URL(request.url ?? '/', 'http://localhost');
	const path = url.pathname;
	if (path === '/') {
		const strip = url.searchParams.get('strip');
		const pre = strip ? `<script>delete window[${JSON.stringify(strip)}];</script>` : '';
		response
			.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' })
			.end(
				`<!doctype html><meta charset="utf-8"><title>e2ee matrix ${url.searchParams.get('tab')}</title>${pre}<script type="module" src="/page.js"></script>`,
			);
		return;
	}
	if (path === '/rpc/hello') {
		const body = await readBody(request);
		helloInfo[body.tab] = body;
		hellos.get(body.tab)?.(body);
		hellos.delete(body.tab);
		response.writeHead(204).end();
		return;
	}
	if (path === '/rpc/next') {
		const tab = url.searchParams.get('tab');
		const old = waiters.get(tab);
		if (old) {
			clearTimeout(old.timer);
			old.response.writeHead(200, { 'Content-Type': 'application/json' }).end('{"none":true}');
		}
		const timer = setTimeout(() => {
			if (waiters.get(tab)?.response === response) waiters.delete(tab);
			response.writeHead(200, { 'Content-Type': 'application/json' }).end('{"none":true}');
		}, 20000);
		waiters.set(tab, { response, timer });
		deliver(tab);
		return;
	}
	if (path === '/rpc/result') {
		const body = await readBody(request);
		results.get(body.cid)?.(body);
		results.delete(body.cid);
		response.writeHead(204).end();
		return;
	}
	if (path === '/rpc/closefailed') {
		const body = await readBody(request);
		closeFailed.add(body.tab);
		response.writeHead(204).end();
		return;
	}
	if (path in TEST_MODULES) {
		response.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' }).end(TEST_MODULES[path]);
		return;
	}
	const file = fileFor(path);
	if (!file) {
		response.writeHead(404).end();
		return;
	}
	response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
	createReadStream(file).pipe(response);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const PORT = server.address().port;
const BASE = `http://127.0.0.1:${PORT}/`;
console.log(`server ${BASE}`);

const send = (tab, command, timeoutMs = 45000) =>
	new Promise((resolve, reject) => {
		const cid = nextCid++;
		const timer = setTimeout(() => {
			results.delete(cid);
			reject(new Error(`RPC timeout after ${timeoutMs} ms (tab ${tab}, ${command.kind ?? 'eval'})`));
		}, timeoutMs);
		results.set(cid, (body) => {
			clearTimeout(timer);
			if (body.ok) resolve(body.value && body.value.__undefined ? undefined : body.value);
			else {
				const error = new Error(body.error.message);
				error.name = body.error.name;
				reject(error);
			}
		});
		if (!queues.has(tab)) queues.set(tab, []);
		queues.get(tab).push({ ...command, cid });
		deliver(tab);
	});

const waitHello = (tab, timeoutMs = 60000) =>
	new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(`tab ${tab} did not load in ${timeoutMs} ms`)), timeoutMs);
		hellos.set(tab, (body) => {
			clearTimeout(timer);
			resolve(body);
		});
	});

const urlFor = (tab, extra = '') => `${BASE}?tab=${tab}${extra}`;

class Tab {
	constructor(id) {
		this.id = id;
	}

	eval(fn, ...args) {
		return send(this.id, { src: fn.toString(), args });
	}

	async navigate(extra = '') {
		const hello = waitHello(this.id);
		await send(this.id, { kind: 'navigate', url: urlFor(this.id, extra) });
		await hello;
		await this.eval(
			() =>
				new Promise((r) =>
					(function wait() {
						'e2eeSearchTest' in window ? r() : setTimeout(wait, 20);
					})(),
				),
		);
	}

	reload() {
		return this.navigate();
	}

	async close() {
		if (safariTransport === 'safaridriver') {
			await wdCall('POST', `/session/${wd.sid}/window`, { handle: tabHandles[this.id] });
			await wdCall('DELETE', `/session/${wd.sid}/window`);
			await new Promise((r) => setTimeout(r, 1200));
			return true;
		}
		await send(this.id, { kind: 'close' });
		await new Promise((r) => setTimeout(r, 1200));
		return !closeFailed.has(this.id);
	}

	logs() {
		return this.eval(() => window.matrix.logs.slice());
	}

	clearLogs() {
		return this.eval(() => {
			window.matrix.logs.length = 0;
		});
	}
}

// ---------------------------------------------------------------- browsers
const started = []; // { pid, what, child }
let profileDir;
let tabSeq = 0;
let mainTab;

// Opens a safaridriver session. Returns false when the session cannot be created, so the caller uses open -g.
const startSafariDriver = async (id) => {
	const probe = createServer();
	await new Promise((done) => probe.listen(0, '127.0.0.1', done));
	const wdPort = probe.address().port;
	probe.close();
	const child = spawn('/usr/bin/safaridriver', ['-p', String(wdPort)], { stdio: ['ignore', 'ignore', 'ignore'] });
	started.push({ pid: child.pid, what: 'safaridriver', child });
	wd = { base: `http://127.0.0.1:${wdPort}` };
	for (let i = 0; i < 50; i++) {
		try {
			await fetch(`${wd.base}/status`);
			break;
		} catch {
			await new Promise((r) => setTimeout(r, 200));
		}
	}
	let session;
	try {
		session = await wdCall('POST', '/session', { capabilities: { alwaysMatch: { browserName: 'safari' } } });
	} catch (error) {
		console.log(`safaridriver session failed: ${error.message}`);
		return false;
	}
	wd.sid = session.sessionId;
	report.notes.push(`safaridriver session ${wd.sid}: ${JSON.stringify(session.capabilities).slice(0, 200)}`);
	tabHandles[id] = await wdCall('GET', `/session/${wd.sid}/window`);
	void wdCall('POST', `/session/${wd.sid}/url`, { url: urlFor(id) }).catch((e) => console.log(`navigate: ${e.message}`));
	return true;
};

const launch = async () => {
	const id = `t${tabSeq++}`;
	const hello = waitHello(id, 90000);
	if (browserName === 'firefox') {
		profileDir = mkdtempSync(join(OUT, 'ff-profile-'));
		writeFileSync(
			join(profileDir, 'user.js'),
			[
				'user_pref("dom.disable_open_during_load", false);',
				'user_pref("browser.link.open_newwindow", 3);',
				'user_pref("dom.allow_scripts_to_close_windows", true);',
				'user_pref("browser.shell.checkDefaultBrowser", false);',
				'user_pref("app.update.enabled", false);',
				'user_pref("app.update.auto", false);',
				'user_pref("datareporting.policy.dataSubmissionEnabled", false);',
				'user_pref("toolkit.telemetry.reportingpolicy.firstRun", false);',
				'user_pref("browser.aboutwelcome.enabled", false);',
				'user_pref("browser.startup.homepage_override.mstone", "ignore");',
				'user_pref("browser.tabs.warnOnClose", false);',
			].join('\n'),
		);
		const child = spawn(BINARIES.firefox, ['-headless', '-no-remote', '-profile', profileDir, urlFor(id)], {
			stdio: ['ignore', 'ignore', 'ignore'],
		});
		started.push({ pid: child.pid, what: 'firefox', child });
	} else if (browserName === 'chrome') {
		profileDir = mkdtempSync(join(OUT, 'chrome-profile-'));
		const child = spawn(
			BINARIES.chrome,
			[
				'--headless=new',
				`--user-data-dir=${profileDir}`,
				'--no-first-run',
				'--no-default-browser-check',
				'--disable-popup-blocking',
				urlFor(id),
			],
			{ stdio: ['ignore', 'ignore', 'ignore'] },
		);
		started.push({ pid: child.pid, what: 'chrome', child });
	} else if (browserName === 'safari') {
		safariTransport = (await startSafariDriver(id)) ? 'safaridriver' : 'open -g';
		if (safariTransport === 'open -g') execFileSync('/usr/bin/open', ['-g', '-a', 'Safari', urlFor(id)]);
		console.log(`safari transport: ${safariTransport}`);
	}
	const info = await hello;
	console.log(`tab ${id} up: ${info.ua} history=${info.historyLength}`);
	const tab = new Tab(id);
	await tab.eval(
		() =>
			new Promise((r) =>
				(function wait() {
					'e2eeSearchTest' in window ? r() : setTimeout(wait, 20);
				})(),
			),
	);
	return tab;
};

const liveTabs = new Set();
const mainOrAny = () => [...liveTabs][0];

const openTab = async () => {
	const id = `t${tabSeq++}`;
	const hello = waitHello(id, 60000);
	if (safariTransport === 'open -g') execFileSync('/usr/bin/open', ['-g', '-a', 'Safari', urlFor(id)]);
	else if (safariTransport === 'safaridriver') {
		// The current window can be a closed one; WebDriver needs a live current window to open a new one.
		await wdCall('POST', `/session/${wd.sid}/window`, { handle: tabHandles[mainOrAny().id] });
		const { handle } = await wdCall('POST', `/session/${wd.sid}/window/new`, { type: 'tab' });
		tabHandles[id] = handle;
		await wdCall('POST', `/session/${wd.sid}/window`, { handle });
		void wdCall('POST', `/session/${wd.sid}/url`, { url: urlFor(id) }).catch((e) => console.log(`navigate: ${e.message}`));
	} else {
		const opened = await mainOrAny().eval((url) => Boolean(window.open(url, '_blank')), urlFor(id));
		if (!opened) throw new Error('window.open was blocked');
	}
	await hello;
	const tab = new Tab(id);
	await tab.eval(
		() =>
			new Promise((r) =>
				(function wait() {
					'e2eeSearchTest' in window ? r() : setTimeout(wait, 20);
				})(),
			),
	);
	return tab;
};

// ---------------------------------------------------------------- test runner
const withTimeout = (promise, ms, label) =>
	Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`test timeout ${ms} ms: ${label}`)), ms))]);
const run = async (group, name, body) => {
	const t0 = Date.now();
	try {
		const detail = await withTimeout(Promise.resolve().then(body), 90000, name);
		report.tests.push({ group, name, status: 'PASS', ms: Date.now() - t0, ...(detail ? { detail } : {}) });
		console.log(`PASS ${group} > ${name}`);
	} catch (error) {
		report.tests.push({ group, name, status: 'FAIL', ms: Date.now() - t0, error: String(error?.message ?? error).slice(0, 2000) });
		console.log(
			`FAIL ${group} > ${name}\n  ${String(error?.message ?? error)
				.split('\n')
				.slice(0, 6)
				.join('\n  ')}`,
		);
	}
};
const poll = async (fn, want, timeoutMs = 5000, interval = 50) => {
	const end = Date.now() + timeoutMs;
	let last;
	while (Date.now() < end) {
		last = await fn();
		if (JSON.stringify(last) === JSON.stringify(want)) return last;
		await new Promise((r) => setTimeout(r, interval));
	}
	throw new Error(`poll: expected ${JSON.stringify(want)}, last ${JSON.stringify(last)}`);
};

// ---- page-side helpers (as source)
const fnCreate = (name, url) => window.e2eeSearchTest.create(name, url ?? undefined);
const fnCreateShared = (name) => window.e2eeSearchTest.createShared(name);
const fnCall = (id, name, list) => window.e2eeSearchTest.call(id, name, list);
const fnFlush = (id) => window.e2eeSearchTest.flush(id);
const fnIsLeader = (id) => window.e2eeSearchTest.isLeader(id);
const fnOpfsFiles = async (needle) => {
	const root = await navigator.storage.getDirectory();
	let folder;
	try {
		folder = await root.getDirectoryHandle('e2ee-search');
	} catch {
		return [];
	}
	const wanted = new TextEncoder().encode(needle);
	const holds = (bytes) => {
		outer: for (let i = 0; i + wanted.length <= bytes.length; i++) {
			for (let j = 0; j < wanted.length; j++) if (bytes[i + j] !== wanted[j]) continue outer;
			return true;
		}
		return false;
	};
	const files = [];
	for await (const [name, handle] of folder) {
		const bytes = new Uint8Array(await (await handle.getFile()).arrayBuffer());
		files.push({ name, size: bytes.length, holdsText: holds(bytes) });
	}
	return files;
};
const fnStoredKeys = async () => {
	const db = await new Promise((resolve, reject) => {
		const request = indexedDB.open('rc-e2ee-search-keys', 1);
		request.onupgradeneeded = () => request.result.createObjectStore('keys');
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	const keys = await new Promise((resolve, reject) => {
		const request = db.transaction('keys').objectStore('keys').getAll();
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	db.close();
	return Promise.all(
		keys.map(async (key) => ({
			type: key.constructor.name,
			extractable: key.extractable,
			exportFails: await crypto.subtle.exportKey('raw', key).then(
				() => false,
				() => true,
			),
		})),
	);
};
const fnIndexFiles = async () => {
	try {
		const folder = await (await navigator.storage.getDirectory()).getDirectoryHandle('e2ee-search');
		const names = [];
		for await (const [name] of folder) names.push(name);
		return names.filter((name) => name.endsWith('.db.enc'));
	} catch {
		return [];
	}
};
const fnEvict = async () => {
	const folder = await (await navigator.storage.getDirectory()).getDirectoryHandle('e2ee-search');
	const names = [];
	for await (const [name] of folder) names.push(name);
	await Promise.all(names.map((name) => folder.removeEntry(name)));
	return names.length;
};
const fnLocks = async (name) => {
	const { held = [], pending = [] } = await navigator.locks.query();
	return {
		leaders: held.filter((lock) => lock.name === name).length,
		waiting: pending.filter((lock) => lock.name === name).length,
		files: held.filter((lock) => lock.name?.startsWith('rc-e2ee-search-file:')).length,
	};
};

const api = (tab) => ({
	create: (ns, url) => tab.eval(fnCreate, ns, url ?? null),
	call: (id, method, ...args) => tab.eval(fnCall, id, method, args),
	flush: (id) => tab.eval(fnFlush, id),
});

// ---------------------------------------------------------------- suites
const main = async () => {
	mainTab = await launch();
	liveTabs.add(mainTab);
	report.userAgent = helloInfo[mainTab.id].ua;
	report.notes.push(`reset: ${JSON.stringify(await mainTab.eval(P.resetOrigin))}`);
	await mainTab.reload();

	// ---- capabilities
	report.capabilities.page = await mainTab.eval(P.pageCapabilities);
	report.capabilities.worker = await mainTab.eval(P.workerCapabilities);
	report.capabilities.sqlite = await mainTab.eval(P.sqliteProbe);
	report.capabilities.logsAfterProbe = await mainTab.logs();
	await mainTab.reload();
	report.capabilities.pageKeyAfterReload = await mainTab.eval(P.pageKeyAfterReload).catch((e) => ({ error: `${e.name}: ${e.message}` }));
	report.capabilities.workerAfterReload = await mainTab.eval(P.workerAfterReload);
	console.log(JSON.stringify(report.capabilities, null, 1));

	// ---- accented word through the backend
	await run('extra', 'indexes "orçamento" and finds it with "orcamento"', async () => {
		const { create, call } = api(mainTab);
		const id = await create('https://accent.example');
		const opened = await call(id, 'open', { userId: 'u1' });
		await call(id, 'upsert', [
			{ id: 'a1', rid: 'r1', uid: 'u1', username: 'alice', ts: 1000, updatedAt: 1000, kind: 'text', body: 'o orçamento da sprint' },
			{ id: 'a2', rid: 'r1', uid: 'u1', username: 'alice', ts: 1001, updatedAt: 1001, kind: 'text', body: 'nothing here' },
		]);
		const hits = (await call(id, 'search', { text: 'orcamento' })).map((h) => h.id);
		const hitsPrefix = (await call(id, 'search', { text: 'orcam' })).map((h) => h.id);
		await call(id, 'wipe');
		expect(hits).toEqual(['a1']);
		expect(hitsPrefix).toEqual(['a1']);
		return { opened, hits, hitsPrefix };
	});

	// Each .pw.ts file runs in a fresh Playwright context, so each group here starts from an empty origin.
	const isolate = async () => {
		await mainTab.reload();
		await mainTab.eval(P.resetOrigin);
		await mainTab.reload();
	};
	// ---- contract (contract.pw.ts)
	await isolate();
	const cases = [];
	let backendCount = 0;
	const createBackend = async () => {
		const id = await mainTab.eval(fnCreate, `contract-${backendCount++}`, null);
		return new Proxy(
			{},
			{
				get: (_t, method) =>
					method === 'then' || typeof method !== 'string' ? undefined : (...args) => mainTab.eval(fnCall, id, method, args),
			},
		);
	};
	describeSearchIndexBackendContract('SQLite WASM backend in a browser', createBackend, {
		describe: (_name, body) => body(),
		it: (name, body) => cases.push({ name, body }),
		expect,
		encryptedAtRest: true,
	});
	for (const c of cases) await run('contract', c.name, c.body);

	// ---- persistence (persistence.pw.ts)
	const NEEDLE = 'quokkazebrafjord';
	const DOC = { id: 'm1', rid: 'r1', uid: 'u1', username: 'alice', ts: 1000, updatedAt: 1000, kind: 'text', body: `the ${NEEDLE} test` };
	await isolate();
	const pa = () => api(mainTab);
	await run('persistence', 'finds a message after a page reload from the encrypted copy, with no crawl', async () => {
		await mainTab.reload();
		const first = await pa().create('https://chat.example');
		const opened = await pa().call(first, 'open', { userId: 'u1' });
		await pa().call(first, 'upsert', [DOC]);
		await pa().flush(first);
		await mainTab.reload();
		const second = await pa().create('https://chat.example');
		const reopened = await pa().call(second, 'open', { userId: 'u1' });
		const hits = (await pa().call(second, 'search', { text: NEEDLE.slice(0, 7) })).map((h) => h.id);
		const detail = { opened, reopened, hits, logs: await mainTab.logs() };
		expect(opened).toEqual({ schemaVersion: 1, encryptedAtRest: true });
		expect(hits).toEqual(['m1']);
		return detail;
	});
	await run('persistence', 'keeps no plaintext in OPFS: the byte scan finds the needle only in a plaintext control file', async () => {
		await mainTab.eval(async (needle) => {
			const folder = await (await navigator.storage.getDirectory()).getDirectoryHandle('e2ee-search', { create: true });
			const writable = await (await folder.getFileHandle('plaintext-control.txt', { create: true })).createWritable();
			await writable.write(`control ${needle} control`);
			await writable.close();
		}, NEEDLE);
		const files = await mainTab.eval(fnOpfsFiles, NEEDLE);
		await mainTab.eval(async () =>
			(await (await navigator.storage.getDirectory()).getDirectoryHandle('e2ee-search')).removeEntry('plaintext-control.txt'),
		);
		expect(files.find((file) => file.name === 'plaintext-control.txt')?.holdsText).toBe(true);
		const index = files.filter((file) => file.name.endsWith('.db.enc'));
		expect(index).toHaveLength(1);
		expect(index[0].size).toBeGreaterThan(4096);
		expect(index[0].holdsText).toBe(false);
		expect(index[0].name).toMatch(/^[0-9a-f]{64}\.db\.enc$/);
		return { files };
	});
	await run('persistence', 'seals the copy under a non-extractable key kept in IndexedDB', async () => {
		const keys = await mainTab.eval(fnStoredKeys);
		expect(keys).toEqual([{ type: 'CryptoKey', extractable: false, exportFails: true }]);
		return { keys };
	});
	await run('persistence', 'keeps the index of each server and user apart', async () => {
		const other = await pa().create('https://other.example');
		await pa().call(other, 'open', { userId: 'u1' });
		expect(await pa().call(other, 'search', { text: NEEDLE })).toEqual([]);
		await pa().call(other, 'upsert', [{ ...DOC, body: 'other server words' }]);
		await pa().flush(other);
		const files = (await mainTab.eval(fnOpfsFiles, NEEDLE)).filter((file) => file.name.endsWith('.db.enc'));
		await pa().call(other, 'wipe');
		expect(files).toHaveLength(2);
	});
	await run('persistence', 'deletes the OPFS file and the IndexedDB key on wipe', async () => {
		await mainTab.reload();
		const backend = await pa().create('https://chat.example');
		await pa().call(backend, 'open', { userId: 'u1' });
		await pa().call(backend, 'wipe');
		expect(await mainTab.eval(fnOpfsFiles, NEEDLE)).toEqual([]);
		expect(await mainTab.eval(fnStoredKeys)).toEqual([]);
	});
	await run('persistence', 'deletes the copy of a user whose index is not open, by scope', async () => {
		await mainTab.reload();
		const first = await pa().create('https://chat.example');
		await pa().call(first, 'open', { userId: 'u9' });
		await pa().call(first, 'upsert', [DOC]);
		await pa().flush(first);
		await mainTab.reload();
		const second = await pa().create('https://chat.example');
		await pa().call(second, 'wipe', { userId: 'u9' });
		expect(await mainTab.eval(fnOpfsFiles, NEEDLE)).toEqual([]);
		expect(await mainTab.eval(fnStoredKeys)).toEqual([]);
	});

	// ---- storage (storage.pw.ts)
	const SNEEDLE = 'pangolinmesaquartz';
	const SDOC = { ...DOC, body: `the ${SNEEDLE} test` };
	const hitIds = async (id) => (await pa().call(id, 'search', { text: SNEEDLE.slice(0, 8) })).map((hit) => hit.id);
	const EVICTED = 'E2EE search index: the saved copy is gone, the index is built again';
	let savesToDisk = false;
	await isolate();
	await run('storage', 'asks the browser once to keep its storage persistent, and logs the answer', async () => {
		await mainTab.reload();
		const backend = await pa().create('https://persist.example');
		const opened = await pa().call(backend, 'open', { userId: 'u1' });
		savesToDisk = opened.encryptedAtRest;
		expect(savesToDisk).toBe(true);
		const requests = (logs) => logs.filter((line) => line === 'E2EE search index: persistent storage requested');
		const answers = (logs) => logs.filter((line) => /^E2EE search index: persistent storage (granted|not granted)$/.test(line));
		expect(requests(await mainTab.logs())).toHaveLength(1);
		let answer = 'no answer (firefox waits for the prompt)';
		if (browserName !== 'firefox') {
			const end = Date.now() + 5000;
			while (answers(await mainTab.logs()).length !== 1 && Date.now() < end) await new Promise((r) => setTimeout(r, 100));
			expect(answers(await mainTab.logs())).toHaveLength(1);
			answer = answers(await mainTab.logs())[0];
		} else {
			const got = answers(await mainTab.logs());
			if (got.length) answer = got[0];
		}
		await pa().call(backend, 'open', { userId: 'u2' });
		await new Promise((r) => setTimeout(r, 500));
		const logs = await mainTab.logs();
		expect(requests(logs)).toHaveLength(1);
		expect(answers(logs).length).toBeLessThanOrEqual(1);
		await pa().call(backend, 'wipe');
		return { answer };
	});
	await run(
		'storage',
		'reports an evicted copy, starts empty with no room state, and finds the message again after the backfill',
		async () => {
			if (!savesToDisk) throw new Error('not run: encryptedAtRest was false in this browser');
			await mainTab.reload();
			const first = await pa().create('https://evict.example');
			await pa().call(first, 'open', { userId: 'u1' });
			await pa().call(first, 'upsert', [SDOC]);
			await pa().call(first, 'setRoomState', 'r1', { lastUpdate: 5, backfillDone: true });
			await pa().flush(first);
			expect(await mainTab.eval(fnEvict)).toBeGreaterThan(0);
			await mainTab.reload();
			const second = await pa().create('https://evict.example');
			expect(await pa().call(second, 'open', { userId: 'u1' })).toEqual({ schemaVersion: 1, encryptedAtRest: true });
			expect(await mainTab.logs()).toContain(EVICTED);
			expect(await hitIds(second)).toEqual([]);
			expect(await pa().call(second, 'getRoomState', 'r1')).toBeUndefined();
			await pa().call(second, 'upsert', [SDOC]);
			expect(await hitIds(second)).toEqual(['m1']);
			await pa().flush(second);
			await mainTab.reload();
			const third = await pa().create('https://evict.example');
			await pa().call(third, 'open', { userId: 'u1' });
			expect(await hitIds(third)).toEqual(['m1']);
			expect(await mainTab.logs()).not.toContain(EVICTED);
			await pa().call(third, 'wipe');
		},
	);
	await run('storage', 'does not report an eviction on the first open of a new user', async () => {
		if (!savesToDisk) throw new Error('not run: encryptedAtRest was false in this browser');
		await mainTab.reload();
		const backend = await pa().create('https://fresh.example');
		await pa().call(backend, 'open', { userId: 'u1' });
		expect(await mainTab.logs()).not.toContain(EVICTED);
		await pa().call(backend, 'wipe');
	});
	await run('storage', 'does not report an eviction when the tab closed before the first copy was saved', async () => {
		if (!savesToDisk) throw new Error('not run: encryptedAtRest was false in this browser');
		await mainTab.reload();
		const first = await pa().create('https://quick-close.example');
		await pa().call(first, 'open', { userId: 'u1' });
		await pa().call(first, 'upsert', [SDOC]);
		await mainTab.reload();
		expect(await mainTab.eval(fnIndexFiles)).toEqual([]);
		const second = await pa().create('https://quick-close.example');
		await pa().call(second, 'open', { userId: 'u1' });
		expect(await mainTab.logs()).not.toContain(EVICTED);
		await pa().call(second, 'wipe');
	});
	await run('storage', 'keeps the index in memory when the browser refuses its storage, and still finds messages', async () => {
		await mainTab.reload();
		const before = await mainTab.eval(fnIndexFiles);
		const backend = await pa().create('https://refused.example', '/test/refused-storage-worker.mjs');
		expect(await pa().call(backend, 'open', { userId: 'u1' })).toEqual({ schemaVersion: 1, encryptedAtRest: false });
		await pa().call(backend, 'upsert', [SDOC]);
		expect(await hitIds(backend)).toEqual(['m1']);
		await pa().flush(backend);
		expect(await mainTab.eval(fnIndexFiles)).toEqual(before);
		await pa().call(backend, 'wipe');
	});
	await run('storage', 'gives no backend in a browser without WebAssembly or workers (feature-check fallback)', async () => {
		await mainTab.reload();
		const full = await mainTab.eval(() => window.e2eeSearchTest.canRun());
		expect(full).toBe(true);
		const out = { full };
		for (const missing of ['WebAssembly', 'Worker']) {
			await mainTab.navigate(`&strip=${missing}`);
			out[missing] = await mainTab.eval(() => window.e2eeSearchTest.canRun());
		}
		await mainTab.navigate();
		expect(out.WebAssembly).toBe(false);
		expect(out.Worker).toBe(false);
		return out;
	});

	// ---- multitab (multitab.pw.ts)
	const NAMESPACE = 'https://chat.example';
	const LOCK = `rc-e2ee-search:${NAMESPACE}`;
	const MNEEDLE = 'wombatglacierquill';
	const LATER = 'narwhaltundrabloom';
	const mdoc = (id, body) => ({ id, rid: 'r1', uid: 'u1', username: 'alice', ts: 1000, updatedAt: 1000, kind: 'text', body });
	await isolate();
	const tabs = [];
	const shared = async (tab) => ({ tab, backend: await tab.eval(fnCreateShared, NAMESPACE) });
	const mcall = (t, method, ...args) => t.tab.eval(fnCall, t.backend, method, args);
	const mleader = (t) => t.tab.eval(fnIsLeader, t.backend);
	const mids = async (t, text) => (await mcall(t, 'search', { text })).map((h) => h.id);
	await run('multitab', 'elects one leader tab, and a write from the other tab is found in both tabs', async () => {
		tabs.push(await shared(mainTab));
		const second = await openTab();
		liveTabs.add(second);
		tabs.push(await shared(second));
		const [first, other] = tabs;
		expect(await mcall(first, 'open', { userId: 'u1' })).toEqual({ schemaVersion: 1, encryptedAtRest: true });
		expect(await mcall(other, 'open', { userId: 'u1' })).toEqual({ schemaVersion: 1, encryptedAtRest: true });
		const leaders = [await mleader(first), await mleader(other)];
		const locks = await first.tab.eval(fnLocks, LOCK);
		expect(leaders.filter(Boolean)).toHaveLength(1);
		expect(locks).toEqual({ leaders: 1, waiting: 1, files: 1 });
		const follower = leaders[0] ? other : first;
		await mcall(follower, 'upsert', [mdoc('m1', `the ${MNEEDLE} note`)]);
		expect(await mids(first, MNEEDLE.slice(0, 6))).toEqual(['m1']);
		expect(await mids(other, MNEEDLE.slice(0, 6))).toEqual(['m1']);
		const stats = await mcall(follower, 'stats');
		expect(stats).toEqual({ docs: 1, bytes: expect.any(Number), rooms: 1 });
		return { leaders, locks };
	});
	await run('multitab', 'moves the lock to the other tab when the leader tab closes, and that tab finds the earlier message', async () => {
		const leaderIndex = (await mleader(tabs[0])) ? 0 : 1;
		const follower = tabs[1 - leaderIndex];
		await follower.tab.eval(fnFlush, follower.backend);
		const closedByScript = await tabs[leaderIndex].tab.close();
		liveTabs.delete(tabs[leaderIndex].tab);
		const t0 = Date.now();
		await poll(() => mleader(follower), true, 5000);
		const takeoverMs = Date.now() - t0;
		expect(await mids(follower, MNEEDLE)).toEqual(['m1']);
		await mcall(follower, 'upsert', [mdoc('m2', `the ${LATER} note`)]);
		expect(await mids(follower, LATER)).toEqual(['m2']);
		expect(await follower.tab.eval(fnLocks, LOCK)).toEqual({ leaders: 1, waiting: 0, files: 1 });
		tabs.splice(leaderIndex, 1);
		return { closedByScript, takeoverMsAfterCloseAck: takeoverMs };
	});
	await run('multitab', 'a tab that opens later joins as a follower of the new leader', async () => {
		const late = await openTab();
		liveTabs.add(late);
		const t = await shared(late);
		tabs.push(t);
		await mcall(t, 'open', { userId: 'u1' });
		expect(await mleader(t)).toBe(false);
		expect(await mids(t, LATER)).toEqual(['m2']);
	});
	await run('multitab', 'refuses a second worker that opens the same encrypted copy', async () => {
		const { tab } = tabs[tabs.length - 1];
		const direct = await tab.eval(fnCreate, NAMESPACE, null);
		const error = await tab.eval(
			(id) =>
				window.e2eeSearchTest.call(id, 'open', [{ userId: 'u1' }]).then(
					() => 'opened',
					(reason) => reason.message,
				),
			direct,
		);
		expect(error).toBe('E2EE search index is open in another worker');
		expect((await tab.eval(fnLocks, LOCK)).files).toBe(1);
	});
	await run(
		'multitab',
		'keeps the key only as a non-extractable CryptoKey in IndexedDB: no key bytes in local storage or OPFS',
		async () => {
			const t = tabs[tabs.length - 1];
			const found = await t.tab.eval(async () => {
				const db = await new Promise((resolve, reject) => {
					const request = indexedDB.open('rc-e2ee-search-keys', 1);
					request.onsuccess = () => resolve(request.result);
					request.onerror = () => reject(request.error);
				});
				const keys = await new Promise((resolve, reject) => {
					const request = db.transaction('keys').objectStore('keys').getAll();
					request.onsuccess = () => resolve(request.result);
					request.onerror = () => reject(request.error);
				});
				db.close();
				const folder = await (await navigator.storage.getDirectory()).getDirectoryHandle('e2ee-search');
				const files = [];
				for await (const [name] of folder) files.push(name);
				return {
					keys: await Promise.all(
						keys.map(async (key) => ({
							type: key.constructor.name,
							extractable: key.extractable,
							exportFails: await crypto.subtle.exportKey('raw', key).then(
								() => false,
								() => true,
							),
						})),
					),
					localStorage: localStorage.length,
					files,
				};
			});
			expect(found.keys).toEqual([{ type: 'CryptoKey', extractable: false, exportFails: true }]);
			expect(found.localStorage).toBe(0);
			expect(found.files).toHaveLength(1);
			expect(found.files[0]).toMatch(/^[0-9a-f]{64}\.db\.enc$/);
			await mcall(t, 'wipe');
			return found;
		},
	);
	report.finalLogs = {};
	for (const tab of liveTabs) report.finalLogs[tab.id] = await tab.logs().catch((e) => `logs failed: ${e.message}`);
};

let fatal;
try {
	await main();
} catch (error) {
	fatal = error;
	report.fatal = `${error?.name}: ${error?.message}`;
	console.log(`FATAL ${report.fatal}`);
}

// ---------------------------------------------------------------- cleanup
try {
	const any = mainOrAny();
	if (any) report.notes.push(`final reset: ${JSON.stringify(await any.eval(P.resetOrigin))}`);
} catch (error) {
	report.notes.push(`final reset failed: ${error.message}`);
}
const closeResults = {};
for (const tab of [...liveTabs]) {
	try {
		closeResults[tab.id] = (await tab.close()) ? 'closed by window.close()' : 'window.close() refused, left on about:blank';
	} catch (error) {
		closeResults[tab.id] = `close failed: ${error.message}`;
	}
}
report.closeResults = closeResults;
if (wd?.sid) {
	try {
		await wdCall('DELETE', `/session/${wd.sid}`);
		report.notes.push(`deleted safaridriver session ${wd.sid}`);
	} catch (error) {
		report.notes.push(`delete session failed: ${error.message}`);
	}
}
report.closeFailed = [...closeFailed];
for (const entry of started) {
	try {
		process.kill(entry.pid, 'SIGTERM');
		report.notes.push(`killed ${entry.what} pid ${entry.pid}`);
	} catch (error) {
		report.notes.push(`kill ${entry.pid}: ${error.message}`);
	}
}
// Firefox can keep writing to its profile after SIGTERM. Wait for each browser to exit before the profile is removed.
for (const entry of started) {
	const exited = () => entry.child.exitCode !== null || entry.child.signalCode !== null;
	for (let i = 0; i < 50 && !exited(); i++) await new Promise((r) => setTimeout(r, 200));
	if (!exited()) {
		entry.child.kill('SIGKILL');
		report.notes.push(`SIGKILL ${entry.what} pid ${entry.pid}: no exit 10 s after SIGTERM`);
	}
}
if (profileDir) rmSync(profileDir, { recursive: true, force: true });
report.port = PORT;
if (safariTransport) report.transport = safariTransport;
const passed = report.tests.filter((t) => t.status === 'PASS').length;
report.summary = `${passed}/${report.tests.length} passed`;
writeFileSync(join(OUT, `results-${browserName}.json`), JSON.stringify(report, null, 2));
console.log(`SUMMARY ${browserName}: ${report.summary}${fatal ? ' (fatal)' : ''}; closes ${JSON.stringify(closeResults)}`);
server.closeAllConnections?.();
server.close();
const failed = report.tests.length - passed;
process.exit(!fatal && passed > 0 && failed === 0 ? 0 : 1);
