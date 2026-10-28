/* eslint-disable no-return-assign, no-sequences, prefer-destructuring */
// The worker probe runs as source in a module worker, so its bodies keep the form that was checked.
// Capability probe that runs in a dedicated module worker, like the product SQLite worker.
const phase = new URL(self.location.href).searchParams.get('phase');
const out = { phase };
const step = async (name, body) => {
	try {
		out[name] = { ok: true, value: await body() };
	} catch (error) {
		out[name] = { ok: false, error: `${error?.name}: ${error?.message}` };
	}
};
const openDb = () =>
	new Promise((resolve, reject) => {
		const request = indexedDB.open('matrix-probe-worker', 1);
		request.onupgradeneeded = () => request.result.createObjectStore('keys');
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
const req = (r) => new Promise((resolve, reject) => ((r.onsuccess = () => resolve(r.result)), (r.onerror = () => reject(r.error))));

if (phase === 'first') {
	await step('WebAssembly', () => typeof WebAssembly);
	await step('opfsGetDirectory', async () => (await navigator.storage.getDirectory()).constructor.name);
	await step('opfsCreateWritable', async () => {
		const root = await navigator.storage.getDirectory();
		const handle = await root.getFileHandle('matrix-probe-w.txt', { create: true });
		if (typeof handle.createWritable !== 'function') return 'createWritable missing';
		const writable = await handle.createWritable();
		await writable.write(new Uint8Array([1, 2, 3]));
		await writable.close();
		const size = (await handle.getFile()).size;
		await root.removeEntry('matrix-probe-w.txt');
		return `write+read ok, size ${size}`;
	});
	await step('opfsSyncAccessHandle', async () => {
		const root = await navigator.storage.getDirectory();
		const handle = await root.getFileHandle('matrix-probe-s.bin', { create: true });
		if (typeof handle.createSyncAccessHandle !== 'function') return 'createSyncAccessHandle missing';
		const access = await handle.createSyncAccessHandle();
		access.write(new Uint8Array([9, 8, 7]), { at: 0 });
		access.flush();
		const size = access.getSize();
		access.close();
		await root.removeEntry('matrix-probe-s.bin');
		return `write ok, size ${size}`;
	});
	await step('webLocks', async () =>
		typeof navigator.locks?.request === 'function' ? navigator.locks.request('matrix-w', async (l) => l.name) : 'missing',
	);
	await step('broadcastChannel', () => typeof BroadcastChannel);
	await step('idbCryptoKeyWorker', async () => {
		const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode('worker key')));
		const db = await openDb();
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
} else {
	await step('idbCryptoKeyWorkerAfterReload', async () => {
		const db = await openDb();
		const key = await req(db.transaction('keys').objectStore('keys').get('k'));
		const c = await req(db.transaction('keys').objectStore('keys').get('c'));
		db.close();
		if (!key) return { found: false };
		const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: c.iv }, key, c.sealed);
		return { found: true, extractable: key.extractable, decrypted: new TextDecoder().decode(plain) };
	});
}
self.postMessage(out);
