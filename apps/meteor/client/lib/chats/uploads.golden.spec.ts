import type { EncryptedFileUploadContent } from './ChatAPI';
import { behavior, getCalls, newXhr, record, resetFakes, resetRandom, upload } from './goldenFakes';
import { createUploadsAPI } from './uploads';

jest.mock('../SDKClient', () => jest.requireActual('./goldenFakes').sdkModule);
jest.mock('../UserAction', () => jest.requireActual('./goldenFakes').userActionModule);
jest.mock('../settings', () => jest.requireActual('./goldenFakes').settingsModule);
jest.mock('../../../lib/i18n', () => jest.requireActual('./goldenFakes').i18nModule);
jest.mock('@rocket.chat/random', () => jest.requireActual('./goldenFakes').randomModule);

const file = new File(['content'], 'a.txt', { type: 'text/plain' });

const peeks = [
	['settings.peek', 'FileUpload_MaxFileSize'],
	['settings.peek', 'FileUpload_MediaTypeBlackList'],
	['settings.peek', 'FileUpload_MediaTypeWhiteList'],
];

const setup = ({ tmid }: { tmid?: string } = {}) => {
	const uploads = createUploadsAPI({ rid: 'GENERAL', tmid });
	uploads.subscribe(() => record('uploads.update', uploads.get()));
	return uploads;
};

const finish = (status: number, responseText: string) => {
	Object.assign(upload.xhr, { status, responseText });
	upload.xhr.onload?.();
};

const lastUpdate = () =>
	getCalls()
		.filter(([fn]) => fn === 'uploads.update')
		.at(-1)?.[1] as { error?: Error; percentage: number }[];

beforeEach(() => {
	resetFakes();
	resetRandom();
	upload.xhr = newXhr();
});

describe('uploads golden: starting an upload', () => {
	it('reads the limits, lists the upload at 0%, then starts the request', async () => {
		const uploads = setup();

		void uploads.send(file);

		expect(getCalls()).toEqual([
			...peeks,
			['uploads.update', [{ id: 'random-1', file, percentage: 0 }]],
			['sdk.rest.upload', '/v1/rooms.media/GENERAL', { file }],
		]);
	});

	it('appends uploads in order with fresh ids', async () => {
		const uploads = setup();

		void uploads.send(file);
		void uploads.send(file);

		expect(uploads.get().map(({ id }) => id)).toEqual(['random-1', 'random-2']);
	});

	it('stays pending until the load event, whatever the status', async () => {
		const uploads = setup();
		let settled = false;

		void uploads.send(file).then(() => {
			settled = true;
		});
		finish(500, '');
		await Promise.resolve();
		expect(settled).toBe(false);

		upload.events?.load({});
		await Promise.resolve();
		await Promise.resolve();
		expect(settled).toBe(true);
	});

	it('sends the encrypted blob, lists the raw file with its metadata, and checks the raw type', async () => {
		const uploads = setup();
		const raw = new File(['raw'], 'secret.txt', { type: 'text/plain' });
		const blob = new File(['cipher'], 'secret.txt', { type: 'application/octet-stream' });
		const encryptedFile = { file: blob, key: {}, iv: 'iv', type: 'text/plain', hash: 'h' };
		const content = {
			rawFile: raw,
			encryptedFile,
			fileContent: { raw: { name: 'secret.txt', size: 3 }, encrypted: { algorithm: 'rc.v1.aes-sha2', ciphertext: 'c' } },
		} as unknown as EncryptedFileUploadContent;

		void uploads.send(blob, content);

		expect(getCalls()).toEqual([
			...peeks,
			[
				'uploads.update',
				[{ id: 'random-1', file: raw, percentage: 0, encryptedFile, metadataForEncryption: { name: 'secret.txt', size: 3 } }],
			],
			[
				'sdk.rest.upload',
				'/v1/rooms.media/GENERAL',
				{ file: blob, content: JSON.stringify({ algorithm: 'rc.v1.aes-sha2', ciphertext: 'c' }) },
			],
		]);
	});
});

describe('uploads golden: rejected before the request', () => {
	it('flags an empty file without starting a request', async () => {
		const uploads = setup();
		const empty = new File([], 'empty.txt', { type: 'text/plain' });

		await uploads.send(empty);

		expect(getCalls()).toEqual([
			...peeks,
			['uploads.update', [{ id: 'random-1', file: empty, percentage: 0 }]],
			['uploads.update', [{ id: 'random-1', file: empty, percentage: 0, error: new Error('FileUpload_File_Empty') }]],
		]);
	});

	it('flags a file over the size limit, formatted in the message', async () => {
		behavior.settings.FileUpload_MaxFileSize = 5;
		const uploads = setup();

		await uploads.send(file);

		expect(lastUpdate()[0].error).toEqual(new Error('File_exceeds_allowed_size_of_bytes {"size":"5 B"}'));
		expect(getCalls().map(([fn]) => fn)).not.toContain('sdk.rest.upload');
	});

	it('accepts a file whose size equals the limit', async () => {
		behavior.settings.FileUpload_MaxFileSize = 7;
		const uploads = setup();

		void uploads.send(file);

		expect(getCalls().map(([fn]) => fn)).toContain('sdk.rest.upload');
	});

	it('flags a blacklisted type by default (svg)', async () => {
		const uploads = setup();
		const svg = new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' });

		await uploads.send(svg);

		expect(lastUpdate()[0].error).toEqual(new Error('FileUpload_MediaType_NotAccepted__type__ {"type":"image/svg+xml"}'));
	});

	it('flags a type outside the whitelist', async () => {
		behavior.settings.FileUpload_MediaTypeWhiteList = 'image/png';
		const uploads = setup();

		await uploads.send(file);

		expect(lastUpdate()[0].error).toEqual(new Error('FileUpload_MediaType_NotAccepted__type__ {"type":"text/plain"}'));
	});

	it('checks the raw type of an encrypted upload but names the blob type in the error', async () => {
		const uploads = setup();
		const raw = new File(['raw'], 'a.svg', { type: 'image/svg+xml' });
		const blob = new File(['cipher'], 'a.svg', { type: 'application/octet-stream' });
		const content = { rawFile: raw, encryptedFile: {}, fileContent: { raw: {} } } as unknown as EncryptedFileUploadContent;

		await uploads.send(blob, content);

		expect(lastUpdate()[0].error?.message).toBe('FileUpload_MediaType_NotAccepted__type__ {"type":"application/octet-stream"}');
	});
});

describe('uploads golden: progress', () => {
	it.each([
		[50, 100, 50],
		[100, 100, 99],
		[1, 3, 33],
		[0, 0, 0],
	])('maps %i of %i bytes to %i%%', (loaded, total, percentage) => {
		const uploads = setup();
		void uploads.send(file);

		upload.events?.progress({ lengthComputable: true, loaded, total });

		expect(uploads.get()[0].percentage).toBe(percentage);
	});

	it('ignores progress that is not computable', () => {
		const uploads = setup();
		void uploads.send(file);
		const before = getCalls().length;

		upload.events?.progress({ lengthComputable: false, loaded: 5, total: 10 });

		expect(getCalls().length).toBe(before);
	});
});

describe('uploads golden: the response', () => {
	it('swaps the id for the server file id and records the url at 100% on 200', () => {
		const uploads = setup();
		void uploads.send(file);

		finish(200, JSON.stringify({ file: { _id: 'file-1', url: '/file-upload/file-1/a.txt' } }));

		expect(lastUpdate()).toEqual([{ id: 'file-1', file, percentage: 100, url: '/file-upload/file-1/a.txt' }]);
	});

	it.each([[400], [403]])('records the server error message on %i', (status) => {
		const uploads = setup();
		void uploads.send(file);

		finish(status, JSON.stringify({ error: 'error-file-too-big' }));

		expect(lastUpdate()).toEqual([{ id: 'random-1', file, percentage: 0, error: new Error('error-file-too-big') }]);
	});

	it('records a generic error for any other status', () => {
		const uploads = setup();
		void uploads.send(file);

		finish(500, '');

		expect(lastUpdate()[0].error).toEqual(new Error('FileUpload_Error'));
	});

	it('records the parse failure when the body is not JSON', () => {
		const uploads = setup();
		void uploads.send(file);

		finish(200, 'not json');

		expect(lastUpdate()[0].percentage).toBe(0);
		expect(lastUpdate()[0].error).toBeInstanceOf(Error);
	});

	it('does nothing before the request is done', () => {
		const uploads = setup();
		void uploads.send(file);
		upload.xhr.readyState = 3;
		const before = getCalls().length;

		finish(200, JSON.stringify({ file: { _id: 'file-1', url: 'u' } }));

		expect(getCalls().length).toBe(before);
	});

	it('records the response text on a network error, twice (event, then the rejection)', async () => {
		const uploads = setup();
		const sending = uploads.send(file);
		upload.xhr.responseText = 'offline';

		upload.events?.error({});
		await sending;

		const updates = getCalls().filter(([fn]) => fn === 'uploads.update');
		expect(updates.slice(1)).toEqual([
			['uploads.update', [{ id: 'random-1', file, percentage: 0, error: new Error('offline') }]],
			['uploads.update', [{ id: 'random-1', file, percentage: 0, error: new Error('offline') }]],
		]);
	});
});

describe('uploads golden: cancel and removal', () => {
	it('cancelling aborts the request, removes the upload, stops the typing activity, then flags the (already removed) upload', async () => {
		const uploads = setup({ tmid: 'thread-1' });
		const sending = uploads.send(file);
		const before = getCalls().length;

		uploads.cancel('random-1');
		await sending;

		expect(getCalls().slice(before)).toEqual([
			['xhr.abort'],
			['uploads.update', []],
			['UserAction.stop', 'GENERAL', 'user-uploading', { tmid: 'thread-1' }],
			['uploads.update', []],
		]);
	});

	it('removing one of two uploads keeps the activity running', () => {
		const uploads = setup();
		void uploads.send(file);
		void uploads.send(file);
		const before = getCalls().length;

		uploads.removeUpload('random-1');

		expect(getCalls().slice(before)).toEqual([['uploads.update', [{ id: 'random-2', file, percentage: 0 }]]]);
	});

	it('removing the last upload stops the activity', () => {
		const uploads = setup();
		void uploads.send(file);
		const before = getCalls().length;

		uploads.removeUpload('random-1');

		expect(getCalls().slice(before)).toEqual([
			['uploads.update', []],
			['UserAction.stop', 'GENERAL', 'user-uploading', { tmid: undefined }],
		]);
	});

	it('clear empties the list and stops the activity', () => {
		const uploads = setup();
		void uploads.send(file);
		const before = getCalls().length;

		uploads.clear();

		expect(getCalls().slice(before)).toEqual([
			['uploads.update', []],
			['UserAction.stop', 'GENERAL', 'user-uploading', { tmid: undefined }],
		]);
	});

	it('wipeFailedOnes keeps the uploads without an error and does not stop the activity', async () => {
		const uploads = setup();
		await uploads.send(new File([], 'empty.txt', { type: 'text/plain' }));
		void uploads.send(file);
		const before = getCalls().length;

		uploads.wipeFailedOnes();

		expect(getCalls().slice(before)).toEqual([['uploads.update', [{ id: 'random-2', file, percentage: 0 }]]]);
	});
});

describe('uploads golden: editing', () => {
	it('sets the alt text', () => {
		const uploads = setup();
		void uploads.send(file);

		uploads.editUploadAltText('random-1', 'a text file');

		expect(uploads.get()[0]).toEqual({ id: 'random-1', file, percentage: 0, altText: 'a text file' });
	});

	it('sets the alt text in the metadata of an encrypted upload too', () => {
		const uploads = setup();
		const content = {
			rawFile: file,
			encryptedFile: { file },
			fileContent: { raw: { name: 'a.txt' } },
		} as unknown as EncryptedFileUploadContent;
		void uploads.send(file, content);

		uploads.editUploadAltText('random-1', 'alt');

		expect(uploads.get()[0]).toMatchObject({ altText: 'alt', metadataForEncryption: { name: 'a.txt', altText: 'alt' } });
	});

	it('renames a file keeping its type, and the metadata name of an encrypted upload', () => {
		const uploads = setup();
		const content = {
			rawFile: file,
			encryptedFile: { file },
			fileContent: { raw: { name: 'a.txt' } },
		} as unknown as EncryptedFileUploadContent;
		void uploads.send(file, content);

		uploads.editUploadFileName('random-1', 'b.txt');

		const [renamed] = uploads.get();
		expect({ name: renamed.file.name, type: renamed.file.type }).toEqual({ name: 'b.txt', type: 'text/plain' });
		expect(renamed).toMatchObject({ metadataForEncryption: { name: 'b.txt' } });
	});

	it('flags the upload and resets its progress when the rename fails', () => {
		const uploads = setup();
		void uploads.send(file);
		upload.events?.progress({ lengthComputable: true, loaded: 40, total: 100 });
		const OriginalFile = globalThis.File;
		globalThis.File = class {
			constructor() {
				throw new Error('no file');
			}
		} as unknown as typeof File;

		try {
			uploads.editUploadFileName('random-1', 'b.txt');
		} finally {
			globalThis.File = OriginalFile;
		}

		expect(uploads.get()[0]).toEqual({ id: 'random-1', file, percentage: 0, error: new Error('FileUpload_Update_Failed') });
	});
});

describe('uploads golden: processing flag', () => {
	it('emits an update when the flag changes and exposes it', () => {
		const uploads = setup();

		uploads.setProcessingUploads(true);

		expect(uploads.getProcessingUploads()).toBe(true);
		expect(getCalls()).toEqual([['uploads.update', []]]);
	});

	it('stops notifying after unsubscribe', () => {
		const uploads = createUploadsAPI({ rid: 'GENERAL' });
		const stop = uploads.subscribe(() => record('late'));

		stop();
		uploads.setProcessingUploads(true);

		expect(getCalls()).toEqual([]);
	});
});
