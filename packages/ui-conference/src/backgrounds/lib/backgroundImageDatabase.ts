const DB_NAME = 'videoconf-background-images';
const STORE = 'images';

export type StoredBackgroundImage = { key: string; uid: string; id: string; name: string; blob: Blob; addedAt: number };

const request = <T>(req: IDBRequest<T>) =>
	new Promise<T>((resolve, reject) => {
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
	});

let database: Promise<IDBDatabase> | undefined;

const openDatabase = () => {
	database ??= new Promise<IDBDatabase>((resolve, reject) => {
		const open = indexedDB.open(DB_NAME, 1);
		open.onupgradeneeded = () => {
			const store = open.result.createObjectStore(STORE, { keyPath: 'key' });
			store.createIndex('uid', 'uid');
		};
		open.onsuccess = () => resolve(open.result);
		open.onerror = () => reject(open.error ?? new Error('IndexedDB could not be opened'));
	}).catch((err) => {
		database = undefined;
		throw err;
	});
	return database;
};

const objectStore = async (mode: IDBTransactionMode) => (await openDatabase()).transaction(STORE, mode).objectStore(STORE);

const keyOf = (uid: string, id: string) => `${uid}:${id}`;

export const readBackgroundImages = async (uid: string) =>
	(await request((await objectStore('readonly')).index('uid').getAll(uid))) as StoredBackgroundImage[];

export const writeBackgroundImage = async (image: Omit<StoredBackgroundImage, 'key'>) => {
	await request((await objectStore('readwrite')).put({ ...image, key: keyOf(image.uid, image.id) }));
};

export const deleteBackgroundImage = async (uid: string, id: string) => {
	await request((await objectStore('readwrite')).delete(keyOf(uid, id)));
};
