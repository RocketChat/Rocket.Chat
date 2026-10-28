// Runs the SQLite database of the browser E2EE search index off the page thread. Nothing leaves this worker except the
// rows that the page asks for. The database lives in memory. A sealed copy goes to the origin private file system
// (OPFS): AES-GCM under a non-extractable key that IndexedDB keeps for each index scope. The copy is not compressed
// before encryption, so its size tells nothing about the text.
import sqlite3InitModule, { type Database } from '@sqlite.org/sqlite-wasm';

import type { ScopeState, SqlRow, WorkerReply, WorkerRequest } from './protocol';

declare const self: DedicatedWorkerGlobalScope;

const SAVE_DELAY_MS = 1000;
const FOLDER = 'e2ee-search';
const KEY_DB = 'rc-e2ee-search-keys';
const KEY_STORE = 'keys';
// The scopes that saved a copy at least once. It is apart from the key store, which holds only keys.
const SAVED_DB = 'rc-e2ee-search-saved';
const SAVED_STORE = 'saved';
// The file starts with these 4 bytes and a 12-byte IV. The rest is the AES-GCM ciphertext of the database.
const MAGIC = new Uint8Array([0x52, 0x43, 0x53, 0x31]); // "RCS1"
const IV_BYTES = 12;
// Only one worker of the origin may write a copy. A worker that waits longer than this for the file lock gives up.
const FILE_LOCK_WAIT_MS = 3000;

type Scope = { id: string; fileName: string; key: CryptoKey; saved: boolean };

const encoder = new TextEncoder();
const sqlite3Ready = sqlite3InitModule();

let db: Database | undefined;
let scope: Scope | undefined; // the open index, or undefined for a memory-only index
let dbScope: string | undefined; // the scope of the open database, memory-only or not
let dirty = false;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let saving: Promise<void> = Promise.resolve();
let releaseFileLock: (() => void) | undefined; // ends the Web Lock that this worker holds on the file of the open scope
let storageRefused = false; // true after the browser refused OPFS or the key store in this worker

const messageOf = (error: unknown): unknown => (error instanceof Error ? error.message : error);
const asError = (error: unknown): Error => (error instanceof Error ? error : new Error(String(error)));
const nameOf = (error: unknown): string | undefined => (error instanceof Error ? error.name : undefined);

// Holds a Web Lock on the copy of one scope until releaseFileLock runs. The page tabs elect one leader that starts the
// only worker, so this lock is the last guard: a second worker that tries to open the same copy is refused. The wait
// covers the short time in which the worker of a tab that just closed still holds the lock.
const takeFileLock = async (fileName: string): Promise<void> => {
	if (typeof navigator.locks?.request !== 'function') return;
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

// A browser without one of these keeps the index in memory only. createWritable is what saves the copy.
const canPersist = (): boolean =>
	typeof indexedDB === 'object' &&
	typeof navigator.storage?.getDirectory === 'function' &&
	typeof FileSystemFileHandle === 'function' &&
	typeof FileSystemFileHandle.prototype.createWritable === 'function' &&
	typeof crypto?.subtle === 'object';

const toHex = (buffer: ArrayBuffer): string => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');

// The file name hides the server and the user: it is a hash of the scope.
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

// The key is made with extractable false, so no script can read its bytes. IndexedDB stores the key object itself.
// The key is stored at once, so a browser that refuses to store it is found at open. `saved` is true only after the
// first copy was written, so a tab that closed before its first save does not look like an eviction later.
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
		// SecurityError: the browser refuses OPFS here (a private window), so this worker saved no copy in it.
		if (nameOf(error) !== 'NotFoundError' && nameOf(error) !== 'SecurityError') throw error;
	}
};

const seal = async (key: CryptoKey, scopeId: string, plain: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> => {
	const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
	const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(scopeId) }, key, plain));
	const file = new Uint8Array(MAGIC.length + IV_BYTES + sealed.length);
	file.set(MAGIC, 0);
	file.set(iv, MAGIC.length);
	file.set(sealed, MAGIC.length + IV_BYTES);
	return file;
};

const unseal = async (key: CryptoKey, scopeId: string, file: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> => {
	if (file.length <= MAGIC.length + IV_BYTES || MAGIC.some((byte, index) => file[index] !== byte)) throw new Error('not an index file');
	const iv = file.subarray(MAGIC.length, MAGIC.length + IV_BYTES);
	return new Uint8Array(
		await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv, additionalData: encoder.encode(scopeId) },
			key,
			file.subarray(MAGIC.length + IV_BYTES),
		),
	);
};

// An open oo1.DB always has its C pointer. It is undefined only after close().
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
	dirty = false;
	// The database is open here, so sqlite3 is ready and the export runs before any other request.
	const plain = (await sqlite3Ready).capi.sqlite3_js_db_export(pointerOf(db));
	try {
		const file = await seal(target.key, target.id, plain);
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
		plain.fill(0);
	}
};

const queueSave = (): Promise<void> => {
	saving = saving.then(saveNow, saveNow).catch((error: unknown) => console.warn('E2EE search index was not saved:', messageOf(error)));
	return saving;
};

const markDirty = (): void => {
	dirty = true;
	if (scope && saveTimer === undefined) saveTimer = setTimeout(queueSave, SAVE_DELAY_MS);
};

const openScope = async (scopeId: string): Promise<ScopeState> => {
	if (scope?.id === scopeId && db) return { persistent: true, restored: false };
	await queueSave();
	db?.close();
	db = undefined;
	scope = undefined;
	dirty = false;
	dropFileLock();
	dbScope = scopeId;

	if (!canPersist()) {
		db = await newMemoryDb();
		return { persistent: false, restored: false, evicted: false };
	}

	const fileName = await fileNameFor(scopeId);
	await takeFileLock(fileName);
	let key: CryptoKey;
	let saved: boolean;
	let file: Uint8Array<ArrayBuffer> | undefined;
	try {
		file = (await readFile(fileName)) as Uint8Array<ArrayBuffer> | undefined;
		({ key, saved } = await getOrCreateKey(scopeId));
	} catch (error) {
		// The browser has the APIs but refuses them here: a private window, a blocked origin, or a key that IndexedDB
		// cannot store. The index works in memory only, and the page says so.
		console.warn('E2EE search index cannot be saved in this browser, keeping it in memory only:', messageOf(error));
		storageRefused = true;
		dropFileLock();
		db = await newMemoryDb();
		return { persistent: false, restored: false, evicted: false };
	}
	scope = { id: scopeId, fileName, key, saved: saved || Boolean(file) };
	if (file) {
		try {
			db = await loadDb(await unseal(key, scopeId, file));
			return { persistent: true, restored: true, evicted: false };
		} catch (error) {
			// A file that this key cannot open (damaged, or sealed under a key that is gone) is useless: start again.
			console.warn('E2EE search index file could not be opened, starting empty:', messageOf(error));
			await removeFile(fileName);
			db = await newMemoryDb();
			return { persistent: true, restored: false, evicted: true };
		}
	}
	db = await newMemoryDb();
	// A copy was saved once and the file is gone: the browser deleted it (storage eviction, or site data cleared).
	return { persistent: true, restored: false, evicted: saved };
};

const wipeScope = async (scopeId: string | undefined): Promise<void> => {
	if (scope?.id === scopeId || scopeId === undefined) {
		clearTimeout(saveTimer);
		saveTimer = undefined;
		dirty = false;
		await saving;
		db?.close();
		db = undefined;
		scope = undefined;
		dropFileLock();
	}
	if (scopeId === undefined || !canPersist()) return;
	try {
		await removeFile(await fileNameFor(scopeId));
		await withKeyStore('readwrite', (store) => idbRequest(store.delete(scopeId)));
		await withSavedStore('readwrite', (store) => idbRequest(store.delete(scopeId)));
	} catch (error) {
		// A browser that refused the storage in this worker saved nothing in it. Any other failure must reach the caller.
		if (!storageRefused) throw error;
		console.warn('E2EE search index storage refused the wipe:', messageOf(error));
	}
};

// Saves the open index and closes it. The copy on disk stays, so the next open of the scope restores it. A memory-only
// index has no copy, so the next open starts it empty.
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
		dbScope = undefined;
		dirty = false;
		dropFileLock();
	}
};

const isWrite = (sql: string): boolean => !/^\s*SELECT\b/i.test(sql);

const run = async (request: WorkerRequest): Promise<SqlRow[] | [ScopeState]> => {
	switch (request.op) {
		case 'open':
			return [await openScope(request.scopeId)];
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

	db ??= await newMemoryDb();
	const open = db;
	switch (request.op) {
		case 'exec': {
			const rows = open.exec({ sql: request.sql, bind: request.bind, rowMode: 'object', returnValue: 'resultRows' }) as SqlRow[];
			if (isWrite(request.sql)) markDirty();
			return rows;
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

// One request at a time, in order, so a save or a scope change never runs between the statements of another call.
let queue: Promise<void> = Promise.resolve();

self.onmessage = ({ data: request }: MessageEvent<WorkerRequest>) => {
	queue = queue.then(async () => {
		let reply: WorkerReply;
		try {
			reply = { id: request.id, rows: (await run(request)) as SqlRow[] };
		} catch (error) {
			reply = { id: request.id, error: error instanceof Error ? error.message : String(error) };
		}
		self.postMessage(reply);
	});
};
