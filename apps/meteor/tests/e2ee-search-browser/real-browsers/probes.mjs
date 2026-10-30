/* eslint-disable no-return-assign, no-sequences, prefer-template, no-empty */
// These functions are sent to the browser as source text (fn.toString()), so their bodies keep the form that was checked.
// Functions that the driver sends to the page as source text (fn.toString()). They must not use any closure.

export const pageCapabilities = async () => {
	const out = {};
	const step = async (name, body) => {
		try {
			out[name] = { ok: true, value: await body() };
		} catch (error) {
			out[name] = { ok: false, error: `${error?.name}: ${error?.message}` };
		}
	};
	const timeoutRace = (promise, ms, label) => Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(label), ms))]);
	await step('Worker', () => typeof Worker);
	await step('WebAssembly', () => typeof WebAssembly + '/' + typeof WebAssembly?.instantiate);
	await step('canRunBrowserBackend', () => window.e2eeSearchTest.canRun());
	await step('isSecureContext', () => window.isSecureContext);
	await step('aesGcm', async () => {
		const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const sealed = await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv, additionalData: new Uint8Array([1]) },
			key,
			new TextEncoder().encode('hello'),
		);
		const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: new Uint8Array([1]) }, key, sealed);
		return new TextDecoder().decode(plain) === 'hello' ? 'roundtrip ok' : 'roundtrip mismatch';
	});
	await step('opfsGetDirectory', async () => {
		const root = await navigator.storage.getDirectory();
		return root.constructor.name;
	});
	await step('opfsCreateWritablePage', async () => {
		const root = await navigator.storage.getDirectory();
		const handle = await root.getFileHandle('matrix-probe.txt', { create: true });
		if (typeof handle.createWritable !== 'function') return 'createWritable missing';
		const writable = await handle.createWritable();
		await writable.write('abc');
		await writable.close();
		const text = await (await handle.getFile()).text();
		await root.removeEntry('matrix-probe.txt');
		return text === 'abc' ? 'write+read ok' : `read back ${text}`;
	});
	await step('webLocks', async () => {
		if (typeof navigator.locks?.request !== 'function') return 'missing';
		const got = await navigator.locks.request('matrix-probe-lock', async (lock) => lock?.name);
		const q = typeof navigator.locks.query === 'function' ? 'query ok' : 'no query';
		return `${got} ${q}`;
	});
	await step('broadcastChannel', async () => {
		if (typeof BroadcastChannel !== 'function') return 'missing';
		const a = new BroadcastChannel('matrix-probe');
		const b = new BroadcastChannel('matrix-probe');
		const got = new Promise((resolve) => (b.onmessage = (event) => resolve(event.data)));
		a.postMessage('ping');
		const value = await timeoutRace(got, 2000, 'timeout');
		a.close();
		b.close();
		return value;
	});
	await step('storagePersisted', async () =>
		typeof navigator.storage?.persisted === 'function' ? navigator.storage.persisted() : 'missing',
	);
	await step('storagePersist', async () =>
		typeof navigator.storage?.persist === 'function'
			? timeoutRace(navigator.storage.persist(), 3000, 'no answer within 3 s (pending prompt)')
			: 'missing',
	);
	await step('storageEstimate', async () => {
		const { quota, usage } = await navigator.storage.estimate();
		return { quota, usage };
	});
	// A non-extractable AES-GCM key stored in IndexedDB on the page, with a ciphertext to check after reload.
	await step('idbCryptoKeyPage', async () => {
		const open = () =>
			new Promise((resolve, reject) => {
				const request = indexedDB.open('matrix-probe-page', 1);
				request.onupgradeneeded = () => request.result.createObjectStore('keys');
				request.onsuccess = () => resolve(request.result);
				request.onerror = () => reject(request.error);
			});
		const req = (r) => new Promise((resolve, reject) => ((r.onsuccess = () => resolve(r.result)), (r.onerror = () => reject(r.error))));
		const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode('survives reload')));
		const db = await open();
		const tx = db.transaction('keys', 'readwrite');
		const done = new Promise(
			(resolve, reject) => ((tx.oncomplete = resolve), (tx.onerror = () => reject(tx.error)), (tx.onabort = () => reject(tx.error))),
		);
		tx.objectStore('keys').put(key, 'k');
		tx.objectStore('keys').put({ iv, sealed }, 'c');
		await done;
		const back = await req(db.transaction('keys').objectStore('keys').get('k'));
		db.close();
		return { storedType: back?.constructor?.name, extractable: back?.extractable };
	});
	return out;
};

export const workerCapabilities = () =>
	new Promise((resolve) => {
		const worker = new Worker('/probe/worker.mjs?phase=first', { type: 'module' });
		const timer = setTimeout(() => resolve({ error: 'probe worker timeout' }), 20000);
		worker.onmessage = (event) => {
			if (event.data?.__log) return;
			clearTimeout(timer);
			worker.terminate();
			resolve(event.data);
		};
		worker.onerror = (event) => {
			clearTimeout(timer);
			resolve({ error: `worker error: ${event.message}` });
		};
	});

export const workerAfterReload = () =>
	new Promise((resolve) => {
		const worker = new Worker('/probe/worker.mjs?phase=reload', { type: 'module' });
		const timer = setTimeout(() => resolve({ error: 'probe worker timeout' }), 20000);
		worker.onmessage = (event) => {
			if (event.data?.__log) return;
			clearTimeout(timer);
			worker.terminate();
			resolve(event.data);
		};
		worker.onerror = (event) => {
			clearTimeout(timer);
			resolve({ error: `worker error: ${event.message}` });
		};
	});

export const pageKeyAfterReload = async () => {
	const db = await new Promise((resolve, reject) => {
		const request = indexedDB.open('matrix-probe-page', 1);
		request.onupgradeneeded = () => request.result.createObjectStore('keys');
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	const req = (r) => new Promise((resolve, reject) => ((r.onsuccess = () => resolve(r.result)), (r.onerror = () => reject(r.error))));
	const key = await req(db.transaction('keys').objectStore('keys').get('k'));
	const c = await req(db.transaction('keys').objectStore('keys').get('c'));
	db.close();
	if (!key) return { found: false };
	const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: c.iv }, key, c.sealed);
	return { found: true, type: key.constructor.name, extractable: key.extractable, decrypted: new TextDecoder().decode(plain) };
};

// Raw SQLite through the product worker: version, FTS5, the product tokenizer, and the accented-word case.
export const sqliteProbe = async () => {
	const runner = window.matrix.createWorkerSqlRunner('/workers/e2ee-search/worker.mjs');
	const out = {};
	const step = async (name, body) => {
		try {
			out[name] = { ok: true, value: await body() };
		} catch (error) {
			out[name] = { ok: false, error: `${error?.name}: ${error?.message}` };
		}
	};
	const scopeId = 'matrix-sqlite-probe';
	const wrapKey = await crypto.subtle.importKey('raw', new Uint8Array(32).fill(7), 'HKDF', false, ['deriveKey']);
	await step('open', () => runner.open(scopeId, wrapKey));
	await step('version', async () => (await runner.exec({ sql: 'select sqlite_version() as v' }))[0].v);
	await step('fts5CompileOption', async () => (await runner.exec({ sql: "select sqlite_compileoption_used('ENABLE_FTS5') as v" }))[0].v);
	await step('fts5Create', async () => {
		await runner.exec({ sql: "create virtual table t using fts5(body, tokenize = 'unicode61 remove_diacritics 2')" });
		await runner.exec({ sql: 'insert into t(body) values (?)', bind: ['o orçamento da sprint'] });
		await runner.exec({ sql: 'insert into t(body) values (?)', bind: ['other text'] });
		return 'created';
	});
	await step('fts5SearchOrcamento', async () =>
		(await runner.exec({ sql: "select body from t where t match 'orcamento*'" })).map((r) => r.body),
	);
	await step('wipe', () => runner.wipe(scopeId));
	await step('close', () => runner.close(scopeId));
	return out;
};

export const resetOrigin = async () => {
	const out = {};
	try {
		const root = await navigator.storage.getDirectory();
		const names = [];
		for await (const [name] of root) names.push(name);
		for (const name of names) await root.removeEntry(name, { recursive: true });
		out.opfsRemoved = names;
	} catch (error) {
		out.opfsError = `${error?.name}: ${error?.message}`;
	}
	const dbs = ['rc-e2ee-search-keys', 'rc-e2ee-search-saved', 'matrix-probe-page', 'matrix-probe-worker'];
	out.idb = await Promise.all(
		dbs.map(
			(name) =>
				new Promise((resolve) => {
					const request = indexedDB.deleteDatabase(name);
					request.onsuccess = () => resolve(`${name}: deleted`);
					request.onerror = () => resolve(`${name}: ${request.error?.message}`);
					request.onblocked = () => resolve(`${name}: blocked`);
				}),
		),
	);
	try {
		localStorage.clear();
		sessionStorage.clear();
	} catch {}
	return out;
};
