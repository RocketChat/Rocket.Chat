import type { IMessage } from '@rocket.chat/core-typings';

import { processMessageUploads } from './processMessageUploads';
import type { Upload } from '../Upload';
import { createGoldenChat, resetStores } from '../goldenChat';
import { behavior, clearCalls, getCalls, modalProps, record, resetFakes } from '../goldenFakes';

jest.mock('../../SDKClient', () => jest.requireActual('../goldenFakes').sdkModule);
jest.mock('../../toast', () => jest.requireActual('../goldenFakes').toastModule);
jest.mock('../../user', () => jest.requireActual('../goldenFakes').userModule);
jest.mock('../../settings', () => jest.requireActual('../goldenFakes').settingsModule);
jest.mock('../../utils/threadMessageUtils', () => jest.requireActual('../goldenFakes').threadMessageUtilsModule);
jest.mock('../../authorization', () => jest.requireActual('../goldenFakes').authorizationModule);
jest.mock('../../getPermaLink', () => jest.requireActual('../goldenFakes').getPermaLinkModule);
jest.mock('../../../../lib/i18n', () => jest.requireActual('../goldenFakes').i18nModule);
jest.mock('@rocket.chat/ui-client', () => jest.requireActual('../goldenFakes').imperativeModalModule);
jest.mock('../../e2ee/rocketchat.e2e', () => jest.requireActual('../goldenFakes').e2eModule);

const message = (extra: object = {}) => ({ _id: 'm1', rid: 'GENERAL', msg: 'caption', ...extra }) as IMessage;

const textFile = new File(['a'], 'a.txt', { type: 'text/plain' });
const otherFile = new File(['b'], 'b.pdf', { type: 'application/pdf' });

const uploaded = (id: string, file: File, extra: object = {}) =>
	({ id, file, url: `/file-upload/${id}/${file.name}`, percentage: 100, ...extra }) as Upload;

const failed = (id: string, file: File) => ({ id, file, percentage: 0, error: new Error('failed') }) as Upload;

const encryptedUpload = (id: string, file: File, extra: object = {}) =>
	uploaded(id, file, {
		encryptedFile: { file, key: { k: 'key' }, iv: 'iv', type: file.type, hash: 'hash' },
		metadataForEncryption: { name: file.name },
		...extra,
	});

const e2eRoom = (convert: boolean) => ({
	shouldConvertSentMessages: async (arg: unknown) => {
		record('e2eRoom.shouldConvertSentMessages', arg);
		return convert;
	},
	encryptMessageContent: async (content: unknown) => {
		record('e2eRoom.encryptMessageContent', content);
		return { algorithm: 'rc.v1.aes-sha2', ciphertext: `c${getCalls().length}` };
	},
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const flush = async () => {
	for (let i = 0; i < 20; i++) {
		await Promise.resolve();
	}
};

const track = (promise: Promise<boolean>) => {
	const state = { settled: false, value: undefined as boolean | undefined, error: undefined as unknown };
	promise.then(
		(value) => {
			state.settled = true;
			state.value = value;
		},
		(error) => {
			state.settled = true;
			state.error = error;
		},
	);
	return state;
};

const confirm = (id: string, endpointFile: File, body: object) => [
	'sdk.rest.post',
	`/v1/rooms.mediaConfirm/GENERAL/${id}`,
	{ fileName: endpointFile.name, ...body },
];

beforeEach(() => {
	resetFakes();
	resetStores();
	modalProps.current = undefined;
	clearCalls();
});

describe('processMessageUploads golden: nothing to do', () => {
	it('returns false without a composer', async () => {
		const chat = createGoldenChat({ withComposer: false });

		await expect(processMessageUploads(chat, message())).resolves.toBe(false);

		expect(getCalls()).toEqual([]);
	});

	it('returns false when the store is empty', async () => {
		const chat = createGoldenChat();

		await expect(processMessageUploads(chat, message())).resolves.toBe(false);

		expect(getCalls()).toEqual([['chat.composer.uploads.get']]);
	});
});

describe('processMessageUploads golden: plain files', () => {
	it('confirms one file with the text, removing it from the store, with the processing flag around the requests', async () => {
		const chat = createGoldenChat({ uploads: [uploaded('f1', textFile)] });

		await expect(processMessageUploads(chat, message())).resolves.toBe(true);

		expect(getCalls()).toEqual([
			['chat.composer.uploads.get'],
			['e2e.getInstanceByRoomId', 'GENERAL'],
			['chat.composer.uploads.get'],
			['chat.composer.uploads.setProcessingUploads', true],
			confirm('f1', textFile, { msg: 'caption', description: undefined, tmid: undefined }),
			['chat.composer.uploads.removeUpload', 'f1'],
			['chat.composer.uploads.setProcessingUploads', false],
		]);
	});

	it('passes the thread id and the alt text as description', async () => {
		const chat = createGoldenChat({ uploads: [uploaded('f1', textFile, { altText: 'alt' })] });

		await processMessageUploads(chat, message({ tmid: 'thread-1' }));

		expect(getCalls()).toContainEqual(confirm('f1', textFile, { msg: 'caption', description: 'alt', tmid: 'thread-1' }));
	});

	it('gives the text to the first valid file only, in order, one request at a time', async () => {
		const chat = createGoldenChat({ uploads: [uploaded('f1', textFile), uploaded('f2', otherFile)] });

		await processMessageUploads(chat, message());

		expect(getCalls().slice(3)).toEqual([
			['chat.composer.uploads.setProcessingUploads', true],
			confirm('f1', textFile, { msg: 'caption', description: undefined, tmid: undefined }),
			['chat.composer.uploads.removeUpload', 'f1'],
			confirm('f2', otherFile, { msg: '', description: undefined, tmid: undefined }),
			['chat.composer.uploads.removeUpload', 'f2'],
			['chat.composer.uploads.setProcessingUploads', false],
		]);
	});

	it('skips an upload that has no url yet but still returns true', async () => {
		const pending = { id: 'p1', file: textFile, percentage: 40 } as Upload;
		const chat = createGoldenChat({ uploads: [pending] });

		await expect(processMessageUploads(chat, message())).resolves.toBe(true);

		expect(getCalls().slice(3)).toEqual([
			['chat.composer.uploads.setProcessingUploads', true],
			['chat.composer.uploads.setProcessingUploads', false],
		]);
	});

	it('toasts a failed confirmation, keeps the unconfirmed files, and still returns true', async () => {
		const failure = new Error('error-room-not-found');
		behavior.post = async (endpoint) => {
			if (endpoint.endsWith('/f2')) {
				throw failure;
			}
			return {};
		};
		const chat = createGoldenChat({ uploads: [uploaded('f1', textFile), uploaded('f2', otherFile), uploaded('f3', textFile)] });

		await expect(processMessageUploads(chat, message())).resolves.toBe(true);

		expect(getCalls().slice(3)).toEqual([
			['chat.composer.uploads.setProcessingUploads', true],
			confirm('f1', textFile, { msg: 'caption', description: undefined, tmid: undefined }),
			['chat.composer.uploads.removeUpload', 'f1'],
			confirm('f2', otherFile, { msg: '', description: undefined, tmid: undefined }),
			['toast', { type: 'error', message: failure }],
			['chat.composer.uploads.setProcessingUploads', false],
		]);
	});
});

describe('processMessageUploads golden: encrypted files', () => {
	it('treats an encrypted upload as plain when the room has no e2e instance', async () => {
		const chat = createGoldenChat({ uploads: [encryptedUpload('f1', textFile)] });

		await processMessageUploads(chat, message());

		expect(getCalls()).toContainEqual(confirm('f1', textFile, { msg: 'caption', description: undefined, tmid: undefined }));
	});

	it('treats a plain upload as plain even in an e2e room', async () => {
		behavior.e2eRoom = e2eRoom(true);
		const chat = createGoldenChat({ uploads: [uploaded('f1', textFile)] });

		await processMessageUploads(chat, message());

		expect(getCalls().slice(1, 4)).toEqual([
			['e2e.getInstanceByRoomId', 'GENERAL'],
			['e2eRoom.shouldConvertSentMessages', { msg: 'caption' }],
			['chat.composer.uploads.get'],
		]);
		expect(getCalls()).toContainEqual(confirm('f1', textFile, { msg: 'caption', description: undefined, tmid: undefined }));
	});

	it('sends only the encrypted file content when sent messages are not converted', async () => {
		behavior.e2eRoom = e2eRoom(false);
		const chat = createGoldenChat({ uploads: [encryptedUpload('f1', textFile)] });

		await processMessageUploads(chat, message());

		const calls = getCalls();
		const encrypted = calls.find(([fn]) => fn === 'e2eRoom.encryptMessageContent');
		expect(encrypted).toEqual(['e2eRoom.encryptMessageContent', { name: 'a.txt' }]);
		expect(calls.slice(4)).toEqual([
			['e2eRoom.encryptMessageContent', { name: 'a.txt' }],
			['chat.composer.uploads.setProcessingUploads', true],
			[
				'sdk.rest.post',
				'/v1/rooms.mediaConfirm/GENERAL/f1',
				{
					fileName: undefined,
					tmid: undefined,
					content: undefined,
					t: 'e2e',
					msg: '',
					fileContent: { algorithm: 'rc.v1.aes-sha2', ciphertext: expect.any(String) },
				},
			],
			['chat.composer.uploads.removeUpload', 'f1'],
			['chat.composer.uploads.setProcessingUploads', false],
		]);
	});

	it('also encrypts the message with the file attachment when sent messages are converted', async () => {
		behavior.e2eRoom = e2eRoom(true);
		const chat = createGoldenChat({ uploads: [encryptedUpload('f1', textFile)] });

		await processMessageUploads(chat, message());

		const encrypts = getCalls().filter(([fn]) => fn === 'e2eRoom.encryptMessageContent');
		expect(encrypts[1]).toEqual([
			'e2eRoom.encryptMessageContent',
			{
				attachments: [
					{
						title: 'a.txt',
						type: 'file',
						title_link: '/file-upload/f1/a.txt',
						title_link_download: true,
						encryption: { key: { k: 'key' }, iv: 'iv' },
						hashes: { sha256: 'hash' },
						fileId: 'f1',
						size: 1,
						format: 'TXT',
					},
				],
				files: [{ _id: 'f1', name: 'a.txt', type: 'text/plain', size: 1, format: 'TXT' }],
				file: { _id: 'f1', name: 'a.txt', type: 'text/plain', size: 1, format: 'TXT' },
				msg: 'caption',
			},
		]);
	});

	it('describes a video with its url, type and size', async () => {
		behavior.e2eRoom = e2eRoom(true);
		const video = new File(['v'], 'v.mp4', { type: 'video/mp4' });
		const chat = createGoldenChat({ uploads: [encryptedUpload('f1', video)] });

		await processMessageUploads(chat, message());

		const [, content] = getCalls().filter(([fn]) => fn === 'e2eRoom.encryptMessageContent')[1] as [string, { attachments: unknown[] }];
		expect(content.attachments[0]).toMatchObject({
			video_url: '/file-upload/f1/v.mp4',
			video_type: 'video/mp4',
			video_size: 1,
		});
		expect(content.attachments[0]).not.toHaveProperty('format');
	});

	describe('images', () => {
		const OriginalImage = globalThis.Image;
		const originalCreate = window.URL.createObjectURL;
		let loads = true;

		beforeEach(() => {
			loads = true;
			window.URL.createObjectURL = (blob: Blob | MediaSource) => {
				record('URL.createObjectURL', (blob as File).name);
				return 'blob:image';
			};
			globalThis.Image = class {
				height = 20;

				width = 30;

				onload: (() => void) | null = null;

				onerror: (() => void) | null = null;

				set src(value: string) {
					record('Image.src', value);
					queueMicrotask(() => (loads ? this.onload?.() : this.onerror?.()));
				}
			} as unknown as typeof Image;
		});

		afterEach(() => {
			globalThis.Image = OriginalImage;
			window.URL.createObjectURL = originalCreate;
		});

		it('adds the measured dimensions and the alt text to an image attachment', async () => {
			behavior.e2eRoom = e2eRoom(true);
			const image = new File(['i'], 'i.png', { type: 'image/png' });
			const chat = createGoldenChat({ uploads: [encryptedUpload('f1', image, { altText: 'a cat' })] });

			await processMessageUploads(chat, message());

			const calls = getCalls();
			expect(calls.slice(calls.findIndex(([fn]) => fn === 'URL.createObjectURL'))[0]).toEqual(['URL.createObjectURL', 'i.png']);
			const [, content] = calls.filter(([fn]) => fn === 'e2eRoom.encryptMessageContent')[1] as [string, { attachments: unknown[] }];
			expect(content.attachments[0]).toMatchObject({
				image_url: '/file-upload/f1/i.png',
				image_type: 'image/png',
				image_size: 1,
				image_dimensions: { height: 20, width: 30 },
				image_alt: 'a cat',
			});
		});

		it('rejects the whole flow when the image cannot be measured, before any request', async () => {
			loads = false;
			behavior.e2eRoom = e2eRoom(true);
			const image = new File(['i'], 'i.png', { type: 'image/png' });
			const chat = createGoldenChat({ uploads: [encryptedUpload('f1', image)] });

			await expect(processMessageUploads(chat, message())).rejects.toThrow('Failed to load image for dimensions');

			expect(getCalls().map(([fn]) => fn)).not.toContain('sdk.rest.post');
			expect(getCalls().map(([fn]) => fn)).not.toContain('chat.composer.uploads.setProcessingUploads');
		});
	});
});

describe('processMessageUploads golden: failed uploads', () => {
	const flushAndWait = async () => {
		await flush();
		await sleep(20);
	};

	it('asks before sending when some uploads failed, with the failing count and name', async () => {
		const chat = createGoldenChat({ uploads: [failed('bad', textFile), uploaded('f1', otherFile)] });

		const result = track(processMessageUploads(chat, message()));
		await flush();

		expect(getCalls()).toEqual([
			['chat.composer.uploads.get'],
			[
				'imperativeModal.open',
				{
					component: 'GenericModal',
					props: {
						variant: 'warning',
						children: '__count__files_failed_to_upload {"count":1,"name":"a.txt"}',
						title: 'Are_you_sure',
						confirmText: 'Send_anyway',
						cancelText: 'Cancel',
						onConfirm: '[Function onConfirm]',
						onCancel: '[Function onCancel]',
						onClose: '[Function onClose]',
					},
				},
			],
		]);
		expect(result.settled).toBe(false);
	});

	it('omits the name when several uploads failed', async () => {
		const chat = createGoldenChat({ uploads: [failed('b1', textFile), failed('b2', otherFile), uploaded('f1', textFile)] });

		void processMessageUploads(chat, message());
		await flush();

		expect((modalProps.current as { children: string }).children).toBe('__count__files_failed_to_upload {"count":2}');
	});

	it('on "send anyway": closes, removes each failed upload, then confirms the valid ones', async () => {
		const chat = createGoldenChat({ uploads: [failed('bad', textFile), uploaded('f1', otherFile)] });

		const result = track(processMessageUploads(chat, message()));
		await flush();
		clearCalls();
		(modalProps.current?.onConfirm as () => void)();
		await flush();

		expect(getCalls()).toEqual([
			['imperativeModal.close'],
			['chat.composer.uploads.removeUpload', 'bad'],
			['e2e.getInstanceByRoomId', 'GENERAL'],
			['chat.composer.uploads.get'],
			['chat.composer.uploads.setProcessingUploads', true],
			confirm('f1', otherFile, { msg: 'caption', description: undefined, tmid: undefined }),
			['chat.composer.uploads.removeUpload', 'f1'],
			['chat.composer.uploads.setProcessingUploads', false],
		]);
		expect(result).toMatchObject({ settled: true, value: true });
	});

	it.each([['onCancel'], ['onClose']])('never settles when the user dismisses with %s (the modal only closes)', async (answer) => {
		const chat = createGoldenChat({ uploads: [failed('bad', textFile), uploaded('f1', otherFile)] });

		const result = track(processMessageUploads(chat, message()));
		await flush();
		clearCalls();
		(modalProps.current?.[answer] as () => void)();
		await flushAndWait();

		expect(getCalls()).toEqual([['imperativeModal.close']]);
		expect(result.settled).toBe(false);
	});

	describe('when every upload failed', () => {
		it('shows a warning with only an Ok button: no cancel text, no cancel handler', async () => {
			const chat = createGoldenChat({ uploads: [failed('b1', textFile), failed('b2', otherFile)] });

			void processMessageUploads(chat, message());
			await flush();

			expect(getCalls()[1]).toEqual([
				'imperativeModal.open',
				{
					component: 'GenericModal',
					props: {
						variant: 'warning',
						children: '__count__files_failed_to_upload {"count":2}',
						title: 'Warning',
						confirmText: 'Ok',
						onConfirm: '[Function onConfirm]',
						onClose: '[Function onClose]',
					},
				},
			]);
		});

		it('names the file when it is the only one', async () => {
			const chat = createGoldenChat({ uploads: [failed('b1', textFile)] });

			void processMessageUploads(chat, message());
			await flush();

			expect((modalProps.current as { children: string }).children).toBe('__count__files_failed_to_upload {"count":1,"name":"a.txt"}');
		});

		it.each([['onConfirm'], ['onClose']])('never settles after %s: the modal only closes and nothing is sent', async (answer) => {
			const chat = createGoldenChat({ uploads: [failed('b1', textFile), failed('b2', otherFile)] });

			const result = track(processMessageUploads(chat, message()));
			await flush();
			clearCalls();
			(modalProps.current?.[answer] as () => void)();
			await flushAndWait();

			expect(getCalls()).toEqual([['imperativeModal.close']]);
			expect(result.settled).toBe(false);
		});
	});
});
