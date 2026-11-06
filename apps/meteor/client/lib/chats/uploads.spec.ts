import type { EncryptedFileUploadContent } from './ChatAPI';
import { isEncryptedUpload } from './Upload';
import { createUploadsAPI } from './uploads';
import { sdk } from '../SDKClient';

jest.mock('../SDKClient', () => ({
	sdk: { rest: { upload: jest.fn() } },
}));

jest.mock('../UserAction', () => ({
	USER_ACTIVITIES: { USER_UPLOADING: 'user-uploading' },
	UserAction: { stop: jest.fn() },
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
};

const STORAGE_KEY = 'composer_uploads_room';
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

beforeEach(() => {
	localStorage.clear();
	xhrs = [];
	jest.mocked(sdk.rest.upload).mockImplementation((_endpoint, _params, events) => {
		const xhr: FakeXhr = {
			readyState: 1,
			DONE: 4,
			status: 0,
			responseText: '',
			abort: jest.fn(),
			load: (event) => events?.load?.(event as ProgressEvent<XMLHttpRequestEventTarget>),
		};
		xhrs.push(xhr);
		return xhr as unknown as XMLHttpRequest;
	});
});

afterEach(() => {
	jest.useRealTimers();
});

describe('UploadsStore persistence', () => {
	it('brings a finished upload back in the next composer for the same room', async () => {
		const first = createUploadsAPI({ rid: 'room' });
		first.attach();
		await uploadFile(first, 'file-1');
		first.detach();

		const second = createUploadsAPI({ rid: 'room' });
		second.attach();

		expect(second.get()).toHaveLength(1);
		expect(second.get()[0]).toMatchObject({ id: 'file-1', url: '/file-upload/file-1/file', percentage: 100, restored: true });
		expect(second.get()[0].file).toMatchObject({ name: 'photo.png', type: 'image/png', size: 6 });
	});

	it('keeps uploads of a thread apart from the room', async () => {
		const thread = createUploadsAPI({ rid: 'room', tmid: 'thread' });
		thread.attach();
		await uploadFile(thread, 'file-1');

		const room = createUploadsAPI({ rid: 'room' });
		room.attach();

		expect(room.get()).toHaveLength(0);
	});

	it('does not keep uploads that are still in flight or failed', () => {
		const store = createUploadsAPI({ rid: 'room' });
		store.attach();
		void store.send(createFile());

		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
		store.clear();
	});

	it('shows the uploads again when the same store is attached after being detached', async () => {
		const store = createUploadsAPI({ rid: 'room' });
		store.attach();
		await uploadFile(store, 'file-1');

		store.detach();
		expect(store.get()).toHaveLength(0);

		store.attach();
		expect(store.get().map(({ id }) => id)).toEqual(['file-1']);
	});

	it('only drops the uploads when the last of its consumers detaches', async () => {
		const store = createUploadsAPI({ rid: 'room' });
		store.attach();
		store.attach();
		await uploadFile(store, 'file-1');

		store.detach();
		expect(store.get()).toHaveLength(1);
	});

	it('discards kept uploads on clear, so they do not come back on the next visit', async () => {
		const first = createUploadsAPI({ rid: 'room' });
		first.attach();
		await uploadFile(first, 'file-1');

		first.clear();
		first.detach();

		const second = createUploadsAPI({ rid: 'room' });
		second.attach();
		expect(second.get()).toHaveLength(0);
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it('cancels the uploads still in flight on clear', () => {
		const store = createUploadsAPI({ rid: 'room' });
		store.attach();
		void store.send(createFile());

		store.clear();

		expect(xhrs[0].abort).toHaveBeenCalled();
	});

	it('forgets an upload once it is removed', async () => {
		const store = createUploadsAPI({ rid: 'room' });
		store.attach();
		await uploadFile(store, 'file-1');
		await uploadFile(store, 'file-2');

		store.removeUpload('file-1');

		expect(readStorage().map(({ id }: { id: string }) => id)).toEqual(['file-2']);
	});

	it('keeps an upload that finishes after its composer was left, without losing the ones already kept', async () => {
		const first = createUploadsAPI({ rid: 'room' });
		first.attach();
		await uploadFile(first, 'file-1');

		const inFlight = first.send(createFile('second.png'));
		first.detach();

		const second = createUploadsAPI({ rid: 'room' });
		second.attach();
		expect(second.get().map(({ id }) => id)).toEqual(['file-1']);

		completeUpload(xhrs[xhrs.length - 1], 'file-2');
		await inFlight;

		expect(readStorage().map(({ id }: { id: string }) => id)).toEqual(['file-1', 'file-2']);
		expect(second.get().map(({ id }) => id)).toEqual(['file-1', 'file-2']);
	});

	it('drops uploads the server has already deleted', async () => {
		jest.useFakeTimers({ now: new Date('2026-11-06T10:00:00Z') });

		const first = createUploadsAPI({ rid: 'room' });
		first.attach();
		await uploadFile(first, 'file-1');
		first.detach();

		jest.setSystemTime(new Date(Date.now() + DAY));

		const second = createUploadsAPI({ rid: 'room' });
		second.attach();

		expect(second.get()).toHaveLength(0);
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it('keeps the alt text', async () => {
		const first = createUploadsAPI({ rid: 'room' });
		first.attach();
		await uploadFile(first, 'file-1');
		first.editUploadAltText('file-1', 'A cat');
		first.detach();

		const second = createUploadsAPI({ rid: 'room' });
		second.attach();

		expect(second.get()[0].altText).toBe('A cat');
	});

	it('keeps the new name and the original size when a restored upload is renamed', async () => {
		const first = createUploadsAPI({ rid: 'room' });
		first.attach();
		await uploadFile(first, 'file-1');
		first.detach();

		const second = createUploadsAPI({ rid: 'room' });
		second.attach();
		second.editUploadFileName('file-1', 'renamed.png');
		second.detach();

		const third = createUploadsAPI({ rid: 'room' });
		third.attach();

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
		first.attach();
		const sending = first.send(encrypted.encryptedFile.file, encrypted);
		completeUpload(xhrs[0], 'file-1');
		await sending;
		first.detach();

		const second = createUploadsAPI({ rid: 'room' });
		second.attach();
		const [restored] = second.get();

		expect(isEncryptedUpload(restored)).toBe(true);
		expect(restored).toMatchObject({
			encryptedFile: { key: { kty: 'oct' }, iv: 'iv', type: 'image/png', hash: 'hash' },
			metadataForEncryption: { name: 'photo.png', type: 'image/png' },
			imageDimensions: { height: 480, width: 640 },
		});
	});

	it('ignores and removes unreadable stored data', () => {
		localStorage.setItem(STORAGE_KEY, '{not json');

		const store = createUploadsAPI({ rid: 'room' });
		store.attach();

		expect(store.get()).toHaveLength(0);
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
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
		store.attach();
		expect(unloadIsBlocked()).toBe(false);

		const sending = store.send(createFile());
		expect(unloadIsBlocked()).toBe(true);

		completeUpload(xhrs[0], 'file-1');
		await sending;
		expect(unloadIsBlocked()).toBe(false);
	});

	it('stops asking once the upload is cancelled', async () => {
		const store = createUploadsAPI({ rid: 'room' });
		store.attach();
		const sending = store.send(createFile());

		store.clear();
		await sending;

		expect(unloadIsBlocked()).toBe(false);
	});

	it('never asks in the desktop app', async () => {
		window.RocketChatDesktop = {} as typeof window.RocketChatDesktop;
		try {
			const store = createUploadsAPI({ rid: 'room' });
			store.attach();
			void store.send(createFile());

			expect(unloadIsBlocked()).toBe(false);
			store.clear();
		} finally {
			delete window.RocketChatDesktop;
		}
	});
});
