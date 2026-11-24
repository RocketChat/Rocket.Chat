import type { EncryptedFileUploadContent } from './ChatAPI';
import { isEncryptedUpload } from './Upload';
import { createUploadsAPI, forgetOtherUsersSavedUploads } from './uploads';
import { sdk } from '../SDKClient';
import { setStorageBackend } from '../sdk/storage';

jest.mock('../SDKClient', () => ({
	sdk: { rest: { upload: jest.fn() } },
}));

jest.mock('../UserAction', () => ({
	USER_ACTIVITIES: { USER_UPLOADING: 'user-uploading' },
	UserAction: { stop: jest.fn() },
}));

const mockLogoutListeners = new Set<() => void>();

const logOut = () => mockLogoutListeners.forEach((listener) => listener());

jest.mock('../sdk/ddpSdk', () => ({
	getDdpSdk: () => ({
		account: {
			onLogout: (listener: () => void) => {
				mockLogoutListeners.add(listener);
				return () => mockLogoutListeners.delete(listener);
			},
		},
	}),
}));

let mockUserId: string | undefined;

jest.mock('../user', () => ({
	getUserId: () => mockUserId,
}));

jest.mock('../settings', () => ({
	settings: { peek: jest.fn(() => -1) },
}));

jest.mock('../utils/restrictions', () => ({
	fileUploadIsValidContentType: jest.fn(() => true),
}));

jest.mock('../../../lib/i18n', () => ({
	i18n: { t: (key: string) => key },
	t: (key: string) => key,
}));

type FakeXhr = {
	readyState: number;
	DONE: number;
	status: number;
	responseText: string;
	abort: jest.Mock;
	onload?: () => void;
	load: (event: unknown) => void;
	progress: (loaded: number, total: number) => void;
};

const STORAGE_KEY = 'composer_uploads_alice_room';
const DAY = 24 * 60 * 60 * 1000;

let xhrs: FakeXhr[];

const completeUpload = (xhr: FakeXhr, fileId: string) => {
	xhr.readyState = xhr.DONE;
	xhr.status = 200;
	xhr.responseText = JSON.stringify({ file: { _id: fileId, url: `/file-upload/${fileId}/file` } });
	xhr.onload?.();
	xhr.load({});
};

const createFile = (name = 'photo.png', content = 'abcdef') => new File([content], name, { type: 'image/png' });

const uploadFile = async (store: ReturnType<typeof createUploadsAPI>, fileId: string, file = createFile()) => {
	const sending = store.send(file);
	completeUpload(xhrs[xhrs.length - 1], fileId);
	await sending;
};

const readStorage = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');

let attachedStores: ReturnType<typeof createUploadsAPI>[];

const attach = (store: ReturnType<typeof createUploadsAPI>) => {
	store.attach();
	attachedStores.push(store);
};

beforeEach(() => {
	mockUserId = 'alice';
	localStorage.clear();
	xhrs = [];
	attachedStores = [];
	jest.mocked(sdk.rest.upload).mockImplementation((_endpoint, _params, events) => {
		const xhr: FakeXhr = {
			readyState: 1,
			DONE: 4,
			status: 0,
			responseText: '',
			abort: jest.fn(),
			load: (event) => events?.load?.(event as ProgressEvent<XMLHttpRequestEventTarget>),
			progress: (loaded, total) =>
				events?.progress?.({ lengthComputable: true, loaded, total } as ProgressEvent<XMLHttpRequestEventTarget>),
		};
		xhrs.push(xhr);
		return xhr as unknown as XMLHttpRequest;
	});
});

afterEach(() => {
	attachedStores.forEach((store) => store.detach());
	// Uploads a test left running would keep their room's store for the next test.
	logOut();
	jest.useRealTimers();
	jest.restoreAllMocks();
});

describe('UploadsStore persistence', () => {
	it('brings a finished upload back in the next composer for the same room', async () => {
		const first = createUploadsAPI({ rid: 'room' });
		attach(first);
		await uploadFile(first, 'file-1');
		first.detach();

		const second = createUploadsAPI({ rid: 'room' });
		attach(second);

		expect(second.get()).toHaveLength(1);
		expect(second.get()[0]).toMatchObject({ id: 'file-1', url: '/file-upload/file-1/file', percentage: 100, restored: true });
		expect(second.get()[0].file).toMatchObject({ name: 'photo.png', type: 'image/png', size: 6 });
	});

	it('keeps uploads of a thread apart from the room', async () => {
		const thread = createUploadsAPI({ rid: 'room', tmid: 'thread' });
		attach(thread);
		await uploadFile(thread, 'file-1');

		const room = createUploadsAPI({ rid: 'room' });
		attach(room);

		expect(room.get()).toHaveLength(0);
	});

	it('does not keep uploads that are still in flight or failed', () => {
		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		void store.send(createFile());

		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it('shows the uploads again when the same store is attached after being detached', async () => {
		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		await uploadFile(store, 'file-1');

		store.detach();
		attach(store);
		expect(store.get().map(({ id }) => id)).toEqual(['file-1']);
	});

	it('only drops the uploads when the last of its consumers detaches', async () => {
		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		attach(store);
		await uploadFile(store, 'file-1');

		store.detach();
		expect(store.get()).toHaveLength(1);
	});

	it('forgets an upload once it is removed', async () => {
		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		await uploadFile(store, 'file-1');
		await uploadFile(store, 'file-2');

		store.removeUpload('file-1');

		expect(readStorage().map(({ id }: { id: string }) => id)).toEqual(['file-2']);
	});

	it('keeps an upload that finishes after its composer was left, without losing the ones already kept', async () => {
		const first = createUploadsAPI({ rid: 'room' });
		attach(first);
		await uploadFile(first, 'file-1');

		const inFlight = first.send(createFile('second.png'));
		first.detach();

		completeUpload(xhrs[xhrs.length - 1], 'file-2');
		await inFlight;

		expect(readStorage().map(({ id }: { id: string }) => id)).toEqual(['file-1', 'file-2']);

		const second = createUploadsAPI({ rid: 'room' });
		attach(second);
		expect(second.get().map(({ id }) => id)).toEqual(['file-1', 'file-2']);
	});

	it('shows an upload still in flight, with its progress, when the room is visited again', async () => {
		const first = createUploadsAPI({ rid: 'room' });
		attach(first);
		await uploadFile(first, 'file-1');

		const inFlight = first.send(createFile('second.png'));
		xhrs[xhrs.length - 1].progress(3, 6);
		first.detach();

		const second = createUploadsAPI({ rid: 'room' });
		attach(second);
		expect(second.get()).toMatchObject([{ id: 'file-1' }, { file: { name: 'second.png' }, percentage: 50 }]);

		completeUpload(xhrs[xhrs.length - 1], 'file-2');
		await inFlight;

		expect(second.get()).toMatchObject([{ id: 'file-1' }, { id: 'file-2', percentage: 100 }]);
	});

	it('shows an upload in flight on the next visit even when its composer was reattached before it started', () => {
		const first = createUploadsAPI({ rid: 'room' });
		attach(first);
		first.detach();
		attach(first);
		void first.send(createFile());
		first.detach();

		const second = createUploadsAPI({ rid: 'room' });
		attach(second);

		expect(second.get()).toMatchObject([{ file: { name: 'photo.png' }, percentage: 0 }]);
	});

	it('drops uploads the server has already deleted', async () => {
		jest.useFakeTimers({ now: new Date('2026-11-06T10:00:00Z') });

		const first = createUploadsAPI({ rid: 'room' });
		attach(first);
		await uploadFile(first, 'file-1');
		first.detach();

		jest.setSystemTime(new Date(Date.now() + DAY));

		const second = createUploadsAPI({ rid: 'room' });
		attach(second);

		expect(second.get()).toHaveLength(0);
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it('drops an upload from an open composer once it expires', async () => {
		jest.useFakeTimers({ now: new Date('2026-11-06T10:00:00Z') });

		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		await uploadFile(store, 'file-1');

		jest.advanceTimersByTime(DAY);

		expect(store.get()).toHaveLength(0);
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it('drops an upload from an open composer once another composer of the room removes it', async () => {
		const first = createUploadsAPI({ rid: 'room' });
		attach(first);
		await uploadFile(first, 'file-1');
		await uploadFile(first, 'file-2');

		const second = createUploadsAPI({ rid: 'room' });
		attach(second);
		second.removeUpload('file-1');

		expect(first.get().map(({ id }) => id)).toEqual(['file-2']);
	});

	it('keeps an upload in the composer when it cannot be stored', async () => {
		jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('Quota exceeded', 'QuotaExceededError');
		});

		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		await uploadFile(store, 'file-1');

		expect(store.get()).toEqual([expect.objectContaining({ id: 'file-1', url: '/file-upload/file-1/file', percentage: 100 })]);
		expect(store.get()[0].error).toBeUndefined();
	});

	it('starts empty when storage is unavailable', () => {
		jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new DOMException('Access denied', 'SecurityError');
		});
		jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
			throw new DOMException('Access denied', 'SecurityError');
		});

		const store = createUploadsAPI({ rid: 'room' });

		expect(() => attach(store)).not.toThrow();
		expect(store.get()).toHaveLength(0);
	});

	it('keeps the alt text', async () => {
		const first = createUploadsAPI({ rid: 'room' });
		attach(first);
		await uploadFile(first, 'file-1');
		first.editUploadAltText('file-1', 'A cat');
		first.detach();

		const second = createUploadsAPI({ rid: 'room' });
		attach(second);

		expect(second.get()[0].altText).toBe('A cat');
	});

	it('keeps the new name and the original size when a restored upload is renamed', async () => {
		const first = createUploadsAPI({ rid: 'room' });
		attach(first);
		await uploadFile(first, 'file-1');
		first.detach();

		const second = createUploadsAPI({ rid: 'room' });
		attach(second);
		second.editUploadFileName('file-1', 'renamed.png');
		second.detach();

		const third = createUploadsAPI({ rid: 'room' });
		attach(third);

		expect(third.get()[0].file).toMatchObject({ name: 'renamed.png', size: 6 });
	});

	it('keeps what is needed to send an encrypted upload', async () => {
		const rawFile = createFile();
		const encrypted: EncryptedFileUploadContent = {
			rawFile,
			fileContent: { raw: { name: 'photo.png', type: 'image/png' } },
			encryptedFile: { file: new File(['cipher'], 'photo.png'), key: { kty: 'oct' }, iv: 'iv', type: 'image/png', hash: 'hash' },
			imageDimensions: { height: 480, width: 640 },
		};

		const first = createUploadsAPI({ rid: 'room' });
		attach(first);
		const sending = first.send(encrypted.encryptedFile.file, encrypted);
		completeUpload(xhrs[0], 'file-1');
		await sending;
		first.detach();

		const second = createUploadsAPI({ rid: 'room' });
		attach(second);
		const [restored] = second.get();

		expect(isEncryptedUpload(restored)).toBe(true);
		expect(restored).toMatchObject({
			encryptedFile: { key: { kty: 'oct' }, iv: 'iv', type: 'image/png', hash: 'hash' },
			metadataForEncryption: { name: 'photo.png', type: 'image/png' },
			imageDimensions: { height: 480, width: 640 },
		});
	});

	it('drops an upload in flight on logout, so the next account does not get it', async () => {
		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		const sending = store.send(createFile());

		logOut();
		await sending;

		expect(xhrs[0].abort).toHaveBeenCalled();
		expect(store.get()).toHaveLength(0);
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it('ignores and removes malformed stored uploads', async () => {
		const first = createUploadsAPI({ rid: 'room' });
		attach(first);
		await uploadFile(first, 'file-1');
		first.detach();

		const [kept] = readStorage();
		localStorage.setItem(STORAGE_KEY, JSON.stringify([kept, { ...kept, id: 'file-2', fileSize: 'big' }, null]));

		const second = createUploadsAPI({ rid: 'room' });
		attach(second);

		expect(second.get().map(({ id }) => id)).toEqual(['file-1']);
		expect(readStorage().map(({ id }: { id: string }) => id)).toEqual(['file-1']);
	});

	it('ignores and removes unreadable stored data', () => {
		localStorage.setItem(STORAGE_KEY, '{not json');

		const store = createUploadsAPI({ rid: 'room' });
		attach(store);

		expect(store.get()).toHaveLength(0);
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
	});
});

describe('UploadsStore across tabs', () => {
	// Another tab writing to the same key: the write itself is already visible here, the event is what announces it.
	const writeFromAnotherTab = (entries: unknown[], storageKey = STORAGE_KEY) => {
		const oldValue = localStorage.getItem(storageKey);
		const newValue = entries.length > 0 ? JSON.stringify(entries) : null;

		if (newValue === null) {
			localStorage.removeItem(storageKey);
		} else {
			localStorage.setItem(storageKey, newValue);
		}

		window.dispatchEvent(new StorageEvent('storage', { key: storageKey, oldValue, newValue, storageArea: localStorage }));
	};

	const persistedUpload = (id: string) => ({
		id,
		fileName: 'photo.png',
		fileType: 'image/png',
		fileSize: 6,
		url: `/file-upload/${id}/file`,
		expiresAt: Date.now() + DAY,
	});

	it('shows an upload another tab kept for the same room', () => {
		const store = createUploadsAPI({ rid: 'room' });
		attach(store);

		writeFromAnotherTab([persistedUpload('file-1')]);

		expect(store.get()).toHaveLength(1);
		expect(store.get()[0]).toMatchObject({ id: 'file-1', restored: true });
	});

	it('drops an upload another tab has sent or discarded', async () => {
		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		await uploadFile(store, 'file-1');

		writeFromAnotherTab([]);

		expect(store.get()).toHaveLength(0);
	});

	it('keeps the uploads another tab did not touch', async () => {
		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		await uploadFile(store, 'file-1');
		await uploadFile(store, 'file-2');

		writeFromAnotherTab([persistedUpload('file-2')]);

		expect(store.get().map(({ id }) => id)).toEqual(['file-2']);
	});

	it('keeps an upload of its own that is still in flight', () => {
		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		void store.send(createFile());

		writeFromAnotherTab([]);

		expect(store.get()).toHaveLength(1);
	});

	it('picks up a rename and a description another tab made', async () => {
		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		await uploadFile(store, 'file-1');
		store.detach();
		attach(store);

		writeFromAnotherTab([{ ...persistedUpload('file-1'), fileName: 'renamed.png', altText: 'A cat' }]);

		expect(store.get()[0].file).toMatchObject({ name: 'renamed.png', size: 6 });
		expect(store.get()[0].altText).toBe('A cat');
	});

	it('picks up a rename of an upload it is still holding the bytes of', async () => {
		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		await uploadFile(store, 'file-1');

		writeFromAnotherTab([{ ...persistedUpload('file-1'), fileName: 'renamed.png', altText: 'A cat' }]);

		expect(store.get()[0].file).toMatchObject({ name: 'renamed.png', size: 6 });
		expect(store.get()[0].altText).toBe('A cat');
	});

	it('picks up a rename of an encrypted upload, including what is encrypted with it', async () => {
		const encryption = { key: { kty: 'oct' }, iv: 'iv', type: 'image/png', hash: 'hash' };
		const encrypted: EncryptedFileUploadContent = {
			rawFile: createFile(),
			fileContent: { raw: { name: 'photo.png', type: 'image/png' } },
			encryptedFile: { ...encryption, file: new File(['cipher'], 'photo.png') },
		};

		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		const sending = store.send(encrypted.encryptedFile.file, encrypted);
		completeUpload(xhrs[xhrs.length - 1], 'file-1');
		await sending;
		store.detach();
		attach(store);

		writeFromAnotherTab([
			{
				...persistedUpload('file-1'),
				fileName: 'renamed.png',
				encryption: { ...encryption, metadataForEncryption: { name: 'renamed.png', type: 'image/png' } },
			},
		]);

		const [restored] = store.get();
		expect(restored.file.name).toBe('renamed.png');
		expect(isEncryptedUpload(restored) && restored.metadataForEncryption).toMatchObject({ name: 'renamed.png' });
	});

	it('ignores what another tab keeps for another room', async () => {
		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		await uploadFile(store, 'file-1');

		writeFromAnotherTab([persistedUpload('file-2')], 'composer_uploads_alice_other-room');

		expect(store.get().map(({ id }) => id)).toEqual(['file-1']);
	});
});

describe('UploadsStore on a workspace that forgets the user session', () => {
	const readSessionStorage = () => JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]');

	afterEach(() => {
		setStorageBackend('local');
		sessionStorage.clear();
	});

	it('keeps the uploads where the login keys are, instead of on disk', async () => {
		setStorageBackend('session');

		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		await uploadFile(store, 'file-1');

		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
		expect(readSessionStorage().map(({ id }: { id: string }) => id)).toEqual(['file-1']);
	});

	it('brings them back in the next composer of the same window', async () => {
		setStorageBackend('session');

		const first = createUploadsAPI({ rid: 'room' });
		attach(first);
		await uploadFile(first, 'file-1');
		first.detach();

		const second = createUploadsAPI({ rid: 'room' });
		attach(second);

		expect(second.get().map(({ id }) => id)).toEqual(['file-1']);
	});

	it('forgets them with the rest of the account, so the next one does not get them', async () => {
		setStorageBackend('session');

		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		await uploadFile(store, 'file-1');

		forgetOtherUsersSavedUploads(undefined);

		expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
		expect(store.get()).toHaveLength(0);
	});
});

describe('UploadsStore across users', () => {
	it('never shows the next user what the previous one left in the same room', async () => {
		const alice = createUploadsAPI({ rid: 'room' });
		attach(alice);
		await uploadFile(alice, 'file-1');
		alice.detach();

		mockUserId = 'bruno';
		const bruno = createUploadsAPI({ rid: 'room' });
		attach(bruno);

		expect(bruno.get()).toHaveLength(0);
	});

	it('forgets the uploads of everyone but the user who logs in', async () => {
		const alice = createUploadsAPI({ rid: 'room' });
		attach(alice);
		await uploadFile(alice, 'file-1');
		alice.detach();

		mockUserId = 'bruno';
		const bruno = createUploadsAPI({ rid: 'room' });
		attach(bruno);
		await uploadFile(bruno, 'file-2');

		forgetOtherUsersSavedUploads('bruno');

		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
		expect(JSON.parse(localStorage.getItem('composer_uploads_bruno_room') ?? '[]')).toMatchObject([{ id: 'file-2' }]);
		expect(bruno.get().map(({ id }) => id)).toEqual(['file-2']);
	});
});

describe('UploadsStore unload warning', () => {
	const unloadIsBlocked = () => {
		const event = new Event('beforeunload', { cancelable: true });
		window.dispatchEvent(event);
		return event.defaultPrevented;
	};

	it('asks before leaving the page only while an upload is in flight', async () => {
		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		expect(unloadIsBlocked()).toBe(false);

		const sending = store.send(createFile());
		expect(unloadIsBlocked()).toBe(true);

		completeUpload(xhrs[0], 'file-1');
		await sending;
		expect(unloadIsBlocked()).toBe(false);
	});

	it('stops asking once the upload is cancelled', async () => {
		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		const sending = store.send(createFile());

		store.cancel(store.get()[0].id);
		await sending;

		expect(unloadIsBlocked()).toBe(false);
	});

	it('never asks in the desktop app', async () => {
		window.RocketChatDesktop = {} as typeof window.RocketChatDesktop;
		try {
			const store = createUploadsAPI({ rid: 'room' });
			attach(store);
			void store.send(createFile());

			expect(unloadIsBlocked()).toBe(false);
		} finally {
			delete window.RocketChatDesktop;
		}
	});
});

describe('UploadsStore progress', () => {
	it('keeps an upload below 100% once all its bytes are sent, until the server answers', () => {
		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		void store.send(createFile());

		xhrs[0].progress(6, 6);

		expect(store.get()[0]).toMatchObject({ percentage: 99 });
		expect(store.get()[0]).not.toHaveProperty('url');
	});

	it('completes the upload with the file url once the server accepts it', async () => {
		const store = createUploadsAPI({ rid: 'room' });
		attach(store);
		const sending = store.send(createFile());
		xhrs[0].progress(6, 6);

		completeUpload(xhrs[0], 'file-1');
		await sending;

		expect(store.get()[0]).toMatchObject({ id: 'file-1', url: '/file-upload/file-1/file', percentage: 100 });
	});
});
