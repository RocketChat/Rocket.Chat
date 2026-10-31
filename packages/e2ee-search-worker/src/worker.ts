import sqlite3InitModule, { type Database } from '@sqlite.org/sqlite-wasm';

import type { ScopeState, SqlRow, WorkerReply, WorkerRequest } from './protocol';

declare const self: DedicatedWorkerGlobalScope;

const SAVE_DELAY_MS = 1000;
const FOLDER = 'e2ee-search';
const KEY_DB = 'rc-e2ee-search-keys';
const KEY_STORE = 'keys';
const SAVED_DB = 'rc-e2ee-search-saved';
const SAVED_STORE = 'saved';
const MAGIC = new Uint8Array([0x52, 0x43, 0x53, 0x32]); // "RCS2"
const IV_BYTES = 12;
const TAG_BYTES = 16;
const DATA_KEY_BYTES = 32;
const WRAPPED_KEY_BYTES = IV_BYTES + DATA_KEY_BYTES + TAG_BYTES;
const SEALED_KEY_BYTES = IV_BYTES + WRAPPED_KEY_BYTES + TAG_BYTES;
const HEADER_BYTES = MAGIC.length + SEALED_KEY_BYTES;
// Changes only with a new file format: a new label makes every saved copy unreadable.
const KEY_WRAP_LABEL = 'Rocket.Chat E2EE search browser index key wrap v1';
const LOCKED: ScopeState = { persistent: false, restored: false, locked: true };
const FILE_LOCK_WAIT_MS = 3000;

type Scope = {
	id: string;
	fileName: string;
	header: Uint8Array<ArrayBuffer>;
	wrappedKey: Uint8Array<ArrayBuffer>;
	dataKey: CryptoKey;
	saved: boolean;
};

const encoder = new TextEncoder();
const sqlite3Ready = sqlite3InitModule();

let db: Database | undefined;
let scope: Scope | undefined;
let memoryScope: Pick<Scope, 'id' | 'wrappedKey'> | undefined;
let dbScope: string | undefined;
let dirty = false;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let saving: Promise<void> = Promise.resolve();
let releaseFileLock: (() => void) | undefined;
let storageRefused = false;

const messageOf = (error: unknown): unknown => (error instanceof Error ? error.message : error);
const asError = (error: unknown): Error => (error instanceof Error ? error : new Error(String(error)));
const nameOf = (error: unknown): string | undefined => (error instanceof Error ? error.name : undefined);

/** Reject a second writer for the same saved index. */
const takeFileLock = async (fileName: string): Promise<void> => {
	await new Promise<void>((granted, refused) => {
		navigator.locks
			.request(`rc-e2ee-search-file:${fileName}`, { signal: AbortSignal.timeout(FILE_LOCK_WAIT_MS) }, () => {
				granted();
				return new Promise<void>((release) => {
					releaseFileLock = release;
				});
			})
			.catch((error: unknown) =>
				refused(
					nameOf(error) === 'TimeoutError' || nameOf(error) === 'AbortError'
						? new Error('E2EE search index is open in another worker')
						: asError(error),
				),
			);
	});
};

const dropFileLock = (): void => {
	releaseFileLock?.();
	releaseFileLock = undefined;
};

const newMemoryDb = async (): Promise<Database> => new (await sqlite3Ready).oo1.DB(':memory:', 'c');

const canStore = (): boolean =>
	typeof indexedDB === 'object' &&
	typeof navigator.storage?.getDirectory === 'function' &&
	typeof FileSystemFileHandle === 'function' &&
	typeof FileSystemFileHandle.prototype.createWritable === 'function' &&
	typeof crypto?.subtle === 'object';

const canPersist = (): boolean => canStore() && typeof navigator.locks?.request === 'function';

const toHex = (buffer: ArrayBuffer): string => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');

/** Keep server and user identifiers out of file names. */
const fileNameFor = async (scopeId: string): Promise<string> =>
	`${toHex(await crypto.subtle.digest('SHA-256', encoder.encode(scopeId)))}.db.enc`;

const idbRequest = <T>(request: IDBRequest<T>): Promise<T> =>
	new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
	});

const openDb = (name: string, storeName: string): Promise<IDBDatabase> => {
	const request = indexedDB.open(name, 1);
	request.onupgradeneeded = () => request.result.createObjectStore(storeName);
	return idbRequest(request);
};

const withStore = async <T>(
	name: string,
	storeName: string,
	mode: IDBTransactionMode,
	body: (store: IDBObjectStore) => Promise<T>,
): Promise<T> => {
	const database = await openDb(name, storeName);
	try {
		const transaction = database.transaction(storeName, mode);
		const done = new Promise((resolve, reject) => {
			transaction.oncomplete = resolve;
			transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
			transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
		});
		const result = await body(transaction.objectStore(storeName));
		await done;
		return result;
	} finally {
		database.close();
	}
};

const withKeyStore = <T>(mode: IDBTransactionMode, body: (store: IDBObjectStore) => Promise<T>): Promise<T> =>
	withStore(KEY_DB, KEY_STORE, mode, body);
const withSavedStore = <T>(mode: IDBTransactionMode, body: (store: IDBObjectStore) => Promise<T>): Promise<T> =>
	withStore(SAVED_DB, SAVED_STORE, mode, body);

const getOrCreateKey = async (scopeId: string): Promise<{ key: CryptoKey; saved: boolean }> => {
	const stored = await withKeyStore('readonly', (store) => idbRequest<CryptoKey | undefined>(store.get(scopeId)));
	if (stored)
		return { key: stored, saved: (await withSavedStore('readonly', (store) => idbRequest<unknown>(store.get(scopeId)))) === true };
	const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
	await withKeyStore('readwrite', (store) => idbRequest(store.put(key, scopeId)));
	return { key, saved: false };
};

const folder = async (): Promise<FileSystemDirectoryHandle> =>
	(await navigator.storage.getDirectory()).getDirectoryHandle(FOLDER, { create: true });

const readFile = async (fileName: string): Promise<Uint8Array | undefined> => {
	try {
		return new Uint8Array(await (await (await (await folder()).getFileHandle(fileName)).getFile()).arrayBuffer());
	} catch (error) {
		if (nameOf(error) === 'NotFoundError') return undefined;
		throw error;
	}
};

const removeFile = async (fileName: string): Promise<void> => {
	try {
		await (await folder()).removeEntry(fileName);
	} catch (error) {
		if (nameOf(error) !== 'NotFoundError' && nameOf(error) !== 'SecurityError') throw error;
	}
};

const concat = (...parts: Uint8Array<ArrayBuffer>[]): Uint8Array<ArrayBuffer> => {
	const joined = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
	let offset = 0;
	for (const part of parts) {
		joined.set(part, offset);
		offset += part.length;
	}
	return joined;
};

/** Prevent ciphertext from being used in another scope. */
const gcm = (scopeId: string, iv: Uint8Array<ArrayBuffer>): AesGcmParams => ({
	name: 'AES-GCM',
	iv,
	additionalData: encoder.encode(scopeId),
});

const encrypt = async (key: CryptoKey, scopeId: string, plain: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> => {
	const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
	return concat(iv, new Uint8Array(await crypto.subtle.encrypt(gcm(scopeId, iv), key, plain)));
};

const decrypt = async (key: CryptoKey, scopeId: string, sealed: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> =>
	new Uint8Array(await crypto.subtle.decrypt(gcm(scopeId, sealed.slice(0, IV_BYTES)), key, sealed.subarray(IV_BYTES)));

const keyWrapKeyOf = (wrapKey: CryptoKey): Promise<CryptoKey> =>
	crypto.subtle.deriveKey(
		{ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: encoder.encode(KEY_WRAP_LABEL) },
		wrapKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['wrapKey', 'unwrapKey'],
	);

const unwrapDataKey = (keyWrapKey: CryptoKey, scopeId: string, wrappedKey: Uint8Array<ArrayBuffer>): Promise<CryptoKey> =>
	crypto.subtle.unwrapKey('raw', wrappedKey.subarray(IV_BYTES), keyWrapKey, gcm(scopeId, wrappedKey.slice(0, IV_BYTES)), 'AES-GCM', false, [
		'encrypt',
		'decrypt',
	]);

/** Return a new key without exposing its plaintext bytes. */
const wrapFreshKey = async (keyWrapKey: CryptoKey, scopeId: string): Promise<Uint8Array<ArrayBuffer>> => {
	const fresh = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
	const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
	return concat(iv, new Uint8Array(await crypto.subtle.wrapKey('raw', fresh, keyWrapKey, gcm(scopeId, iv))));
};

const createDataKey = async (
	keyWrapKey: CryptoKey,
	storeKey: CryptoKey,
	scopeId: string,
): Promise<Pick<Scope, 'header' | 'wrappedKey' | 'dataKey'>> => {
	const wrappedKey = await wrapFreshKey(keyWrapKey, scopeId);
	return {
		header: concat(MAGIC, await encrypt(storeKey, scopeId, wrappedKey)),
		wrappedKey,
		dataKey: await unwrapDataKey(keyWrapKey, scopeId, wrappedKey),
	};
};

/** Distinguish a different wrap key from an unreadable saved index. */
const openFile = async (
	file: Uint8Array<ArrayBuffer>,
	storeKey: CryptoKey,
	keyWrapKey: CryptoKey,
	scopeId: string,
): Promise<(Pick<Scope, 'header' | 'wrappedKey' | 'dataKey'> & { plain: Uint8Array<ArrayBuffer> }) | 'otherKey'> => {
	if (file.length < HEADER_BYTES + IV_BYTES + TAG_BYTES || MAGIC.some((byte, index) => file[index] !== byte)) {
		throw new Error('not an index file');
	}
	const header = file.slice(0, HEADER_BYTES);
	const wrappedKey = await decrypt(storeKey, scopeId, header.subarray(MAGIC.length));
	if (wrappedKey.length !== WRAPPED_KEY_BYTES) throw new Error('not an index file');
	let dataKey: CryptoKey;
	try {
		dataKey = await unwrapDataKey(keyWrapKey, scopeId, wrappedKey);
	} catch {
		return 'otherKey';
	}
	return { header, wrappedKey, dataKey, plain: await decrypt(dataKey, scopeId, file.subarray(HEADER_BYTES)) };
};

const opensScope = async (wrapKey: CryptoKey, open: Pick<Scope, 'id' | 'wrappedKey'>): Promise<boolean> => {
	try {
		await unwrapDataKey(await keyWrapKeyOf(wrapKey), open.id, open.wrappedKey);
		return true;
	} catch {
		return false;
	}
};

const pointerOf = (database: Database) => {
	if (database.pointer === undefined) throw new Error('E2EE search index database is closed');
	return database.pointer;
};

const loadDb = async (plain: Uint8Array): Promise<Database> => {
	const sqlite3 = await sqlite3Ready;
	const loaded = new sqlite3.oo1.DB(':memory:', 'c');
	const pointer = sqlite3.wasm.allocFromTypedArray(plain);
	plain.fill(0);
	const rc = sqlite3.capi.sqlite3_deserialize(
		pointerOf(loaded),
		'main',
		pointer,
		plain.length,
		plain.length,
		sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE,
	);
	if (rc !== 0) {
		loaded.close();
		throw new Error(`sqlite3_deserialize failed: ${rc}`);
	}
	return loaded;
};

const saveNow = async (): Promise<void> => {
	clearTimeout(saveTimer);
	saveTimer = undefined;
	if (!dirty || !scope || !db) return;
	const target = scope;
	const open = db;
	dirty = false;
	let plain: Uint8Array<ArrayBuffer> | undefined;
	try {
		const exported = (await sqlite3Ready).capi.sqlite3_js_db_export(pointerOf(open));
		plain = exported;
		const file = concat(target.header, await encrypt(target.dataKey, target.id, exported));
		// createWritable writes to a swap file and replaces the old file only on close, so a crash keeps the old copy.
		const writable = await (await (await folder()).getFileHandle(target.fileName, { create: true })).createWritable();
		await writable.write(file);
		await writable.close();
		if (!target.saved) {
			await withSavedStore('readwrite', (store) => idbRequest(store.put(true, target.id)));
			target.saved = true;
		}
	} catch (error) {
		if (scope === target) dirty = true;
		throw error;
	} finally {
		plain?.fill(0);
	}
};

/** Report save failures without preventing later saves. */
const queueSave = (): Promise<void> => {
	const saved = saving.then(saveNow, saveNow);
	saving = saved.catch(() => undefined);
	return saved;
};

const warnUnsaved = (error: unknown): void => console.warn('E2EE search index was not saved:', messageOf(error));

const markDirty = (): void => {
	dirty = true;
	if (scope && saveTimer === undefined) saveTimer = setTimeout(() => queueSave().catch(warnUnsaved), SAVE_DELAY_MS);
};

const openMemoryDb = async (keyWrapKey: CryptoKey, scopeId: string): Promise<ScopeState> => {
	memoryScope = { id: scopeId, wrappedKey: await wrapFreshKey(keyWrapKey, scopeId) };
	db = await newMemoryDb();
	return { persistent: false, restored: false, evicted: false };
};

const removeStored = async (scopeId: string): Promise<void> => {
	await removeFile(await fileNameFor(scopeId));
	await withKeyStore('readwrite', (store) => idbRequest(store.delete(scopeId)));
	await withSavedStore('readwrite', (store) => idbRequest(store.delete(scopeId)));
};

const openScope = async (scopeId: string, wrapKey: CryptoKey | undefined): Promise<ScopeState> => {
	if (!wrapKey) {
		clearTimeout(saveTimer);
		saveTimer = undefined;
		await saving;
		db?.close();
		db = undefined;
		scope = undefined;
		memoryScope = undefined;
		dbScope = undefined;
		dirty = false;
		dropFileLock();
		return LOCKED;
	}
	const open = scope ?? memoryScope;
	if (open?.id === scopeId && db && wrapKey && (await opensScope(wrapKey, open)))
		return { persistent: scope !== undefined, restored: false };
	await queueSave();
	db?.close();
	db = undefined;
	scope = undefined;
	memoryScope = undefined;
	dbScope = undefined;
	dirty = false;
	dropFileLock();

	storageRefused = false;
	try {
		const keyWrapKey = await keyWrapKeyOf(wrapKey);
		dbScope = scopeId;

		if (!canPersist()) return await openMemoryDb(keyWrapKey, scopeId);

		const fileName = await fileNameFor(scopeId);
		await takeFileLock(fileName);
		let storeKey: CryptoKey;
		let saved: boolean;
		let file: Uint8Array<ArrayBuffer> | undefined;
		try {
			file = (await readFile(fileName)) as Uint8Array<ArrayBuffer> | undefined;
			({ key: storeKey, saved } = await getOrCreateKey(scopeId));
		} catch (error) {
			console.warn('E2EE search index cannot be saved in this browser, keeping it in memory only:', messageOf(error));
			storageRefused = true;
			dropFileLock();
			return await openMemoryDb(keyWrapKey, scopeId);
		}
		if (file) {
			let otherKey = false;
			try {
				const opened = await openFile(file, storeKey, keyWrapKey, scopeId);
				if (opened === 'otherKey') {
					otherKey = true;
				} else {
					const { plain, ...keys } = opened;
					db = await loadDb(plain);
					scope = { id: scopeId, fileName, ...keys, saved: true };
					return { persistent: true, restored: true, evicted: false };
				}
			} catch (error) {
				console.warn('E2EE search index file could not be opened, starting empty:', messageOf(error));
				await removeFile(fileName);
			}
			if (otherKey) {
				console.warn('E2EE search index was sealed under another E2EE key, starting empty');
				await removeStored(scopeId);
				({ key: storeKey } = await getOrCreateKey(scopeId));
				scope = { id: scopeId, fileName, ...(await createDataKey(keyWrapKey, storeKey, scopeId)), saved: false };
				db = await newMemoryDb();
				return { persistent: true, restored: false, evicted: false };
			}
		}
		scope = { id: scopeId, fileName, ...(await createDataKey(keyWrapKey, storeKey, scopeId)), saved: saved || Boolean(file) };
		db = await newMemoryDb();
		return { persistent: true, restored: false, evicted: Boolean(file) || saved };
	} catch (error) {
		try {
			db?.close();
		} finally {
			db = undefined;
			scope = undefined;
			memoryScope = undefined;
			dbScope = undefined;
			dirty = false;
			storageRefused = false;
			dropFileLock();
		}
		throw error;
	}
};

const wipeScope = async (scopeId: string): Promise<void> => {
	if (typeof scopeId !== 'string') throw new Error('E2EE search index wipe requires a scope ID');
	if (dbScope === scopeId) {
		clearTimeout(saveTimer);
		saveTimer = undefined;
		dirty = false;
		await saving;
		db?.close();
		db = undefined;
		scope = undefined;
		memoryScope = undefined;
		dbScope = undefined;
		dropFileLock();
	}
	if (!canStore()) return;
	try {
		await removeStored(scopeId);
	} catch (error) {
		if (!storageRefused) throw error;
		console.warn('E2EE search index storage refused the wipe:', messageOf(error));
	}
};

/** Close active access without deleting a saved index. */
const closeScope = async (scopeId: string): Promise<void> => {
	if (dbScope !== scopeId) return;
	clearTimeout(saveTimer);
	saveTimer = undefined;
	const saved = saving.then(saveNow);
	saving = saved.catch(() => undefined);
	try {
		await saved;
	} finally {
		db?.close();
		db = undefined;
		scope = undefined;
		memoryScope = undefined;
		dbScope = undefined;
		dirty = false;
		dropFileLock();
	}
};

const isWrite = (sql: string): boolean => !/^\s*SELECT\b/i.test(sql);

const run = async (request: WorkerRequest): Promise<SqlRow[] | [ScopeState]> => {
	switch (request.op) {
		case 'open':
			return [await openScope(request.scopeId, request.wrapKey)];
		case 'wipe':
			await wipeScope(request.scopeId);
			return [];
		case 'close':
			await closeScope(request.scopeId);
			return [];
		case 'flush':
			await queueSave();
			return [];
	}

	if (!db) throw new Error('E2EE search index is not open');
	const open = db;
	switch (request.op) {
		case 'exec': {
			const statements: string[] = [];
			try {
				return open.exec({
					sql: request.sql,
					bind: request.bind,
					rowMode: 'object',
					returnValue: 'resultRows',
					saveSql: statements,
				}) as SqlRow[];
			} finally {
				if (statements.some(isWrite)) markDirty();
			}
		}
		case 'batch':
			open.transaction(() => {
				for (const statement of request.statements) {
					open.exec({ sql: statement.sql, bind: statement.bind });
				}
			});
			markDirty();
			return [];
		default:
			throw new Error(`Unknown operation: ${String((request as { op: unknown }).op)}`);
	}
};

// Requests must not interleave with saves or scope changes.
let queue: Promise<void> = Promise.resolve();

/** Report results that cannot be sent instead of leaving callers waiting. */
const answer = (reply: WorkerReply): void => {
	try {
		self.postMessage(reply);
	} catch (error) {
		self.postMessage({
			id: reply.id,
			error: `E2EE search index could not send the result: ${String(messageOf(error))}`,
		} satisfies WorkerReply);
	}
};

self.onmessage = ({ data: request }: MessageEvent<WorkerRequest>) => {
	queue = queue
		.then(async () => {
			let reply: WorkerReply;
			try {
				reply = { id: request.id, rows: (await run(request)) as SqlRow[] };
			} catch (error) {
				reply = { id: request.id, error: error instanceof Error ? error.message : String(error) };
			}
			answer(reply);
		})
		.catch((error: unknown) => console.warn('E2EE search index could not answer a request:', messageOf(error)));
};
