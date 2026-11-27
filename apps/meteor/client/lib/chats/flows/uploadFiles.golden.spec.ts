import type { IRoom } from '@rocket.chat/core-typings';

import { uploadFiles } from './uploadFiles';
import { Rooms } from '../../../stores';
import type { Upload } from '../Upload';
import { createGoldenChat, resetStores } from '../goldenChat';
import { behavior, clearCalls, getCalls, record, resetFakes } from '../goldenFakes';

jest.mock('../../SDKClient', () => jest.requireActual('../goldenFakes').sdkModule);
jest.mock('../../toast', () => jest.requireActual('../goldenFakes').toastModule);
jest.mock('../../user', () => jest.requireActual('../goldenFakes').userModule);
jest.mock('../../settings', () => jest.requireActual('../goldenFakes').settingsModule);
jest.mock('../../utils/threadMessageUtils', () => jest.requireActual('../goldenFakes').threadMessageUtilsModule);
jest.mock('../../authorization', () => jest.requireActual('../goldenFakes').authorizationModule);
jest.mock('../../getPermaLink', () => jest.requireActual('../goldenFakes').getPermaLinkModule);
jest.mock('../../../../lib/i18n', () => jest.requireActual('../goldenFakes').i18nModule);
jest.mock('../../e2ee', () => jest.requireActual('../goldenFakes').e2eModule);

const a = new File(['a'], 'a.txt', { type: 'text/plain' });
const b = new File(['bb'], 'b.png', { type: 'image/png' });

const existing = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `u${i}` }) as Upload);

const resetFileInput = () => record('resetFileInput');

const lead = (...rest: unknown[][]) => [['chat.composer.uploads.get'], ['chat.data.getRoom'], ...rest];

const encryptedRoom = (overrides: Partial<Record<'encryptFile' | 'isReady' | 'encryptMessageContent', unknown>> = {}) => ({
	encryptFile: async (file: File) => {
		record('e2eRoom.encryptFile', file);
		return { file: new File(['cipher'], file.name, { type: 'application/octet-stream' }), key: { k: 'key' }, iv: 'iv', hash: 'hash' };
	},
	isReady: () => {
		record('e2eRoom.isReady');
		return true;
	},
	encryptMessageContent: async (content: unknown) => {
		record('e2eRoom.encryptMessageContent', content);
		return { algorithm: 'rc.v1.aes-sha2', ciphertext: 'cipher' };
	},
	...overrides,
});

beforeEach(() => {
	resetFakes();
	resetStores();
	Rooms.state.store({ _id: 'GENERAL', t: 'c' } as IRoom);
	clearCalls();
});

describe('uploadFiles golden: preconditions', () => {
	it('throws when the composer has no uploads store, before touching anything', async () => {
		const chat = createGoldenChat({ withComposer: false });

		await expect(uploadFiles(chat, { files: [a] })).rejects.toThrow('No uploads store found in composer');

		expect(getCalls()).toEqual([]);
	});

	it('toasts and stops when the files plus the queued uploads exceed the limit, without loading the room', async () => {
		const chat = createGoldenChat({ uploads: existing(9) });

		await expect(uploadFiles(chat, { files: [a, b] })).resolves.toBeUndefined();

		expect(getCalls()).toEqual([
			['chat.composer.uploads.get'],
			['toast', { type: 'error', message: 'You_cant_upload_more_than__count__files {"count":10}' }],
		]);
	});

	it('accepts exactly the limit', async () => {
		const chat = createGoldenChat({ uploads: existing(9) });

		await uploadFiles(chat, { files: [a] });

		expect(getCalls().map(([fn]) => fn)).toContain('chat.composer.uploads.send');
	});

	it('rejects when the room is not in the store', async () => {
		Rooms.useStore.setState({ records: new Map() });
		const chat = createGoldenChat();

		await expect(uploadFiles(chat, { files: [a] })).rejects.toThrow('Room not found');

		expect(getCalls()).toEqual(lead());
	});

	it('toasts in an encrypted room that allows neither unencrypted messages nor encrypted files', async () => {
		Rooms.state.store({ _id: 'GENERAL', t: 'c', encrypted: true } as IRoom);
		const chat = createGoldenChat();

		await expect(uploadFiles(chat, { files: [a] })).resolves.toBeUndefined();

		expect(getCalls()).toEqual(
			lead(
				['settings.peek', 'E2E_Allow_Unencrypted_Messages'],
				['settings.peek', 'E2E_Enable_Encrypt_Files'],
				['toast', { type: 'error', message: 'You_cant_send_unencrypted_files_in_an_encrypted_room' }],
			),
		);
	});

	it('does not read the second setting when unencrypted messages are allowed', async () => {
		Rooms.state.store({ _id: 'GENERAL', t: 'c', encrypted: true } as IRoom);
		behavior.settings.E2E_Allow_Unencrypted_Messages = true;
		const chat = createGoldenChat();

		await uploadFiles(chat, { files: [a] });

		expect(getCalls().slice(0, 3)).toEqual(lead(['settings.peek', 'E2E_Allow_Unencrypted_Messages']));
	});
});

describe('uploadFiles golden: unencrypted room', () => {
	it('resets the input, marks the activity, sends each file, then focuses the composer', async () => {
		const chat = createGoldenChat();

		await uploadFiles(chat, { files: [a], resetFileInput });

		expect(getCalls()).toEqual(
			lead(
				['resetFileInput'],
				['chat.action.performContinuously', 'uploading'],
				['e2e.getInstanceByRoomId', 'GENERAL'],
				['chat.composer.uploads.send', a, undefined],
				['chat.composer.focus'],
			),
		);
	});

	it('looks up the encryption instance for all files first, then sends in order', async () => {
		const chat = createGoldenChat();

		await uploadFiles(chat, { files: [a, b] });

		expect(getCalls().slice(2)).toEqual([
			['chat.action.performContinuously', 'uploading'],
			['e2e.getInstanceByRoomId', 'GENERAL'],
			['e2e.getInstanceByRoomId', 'GENERAL'],
			['chat.composer.uploads.send', a, undefined],
			['chat.composer.uploads.send', b, undefined],
			['chat.composer.focus'],
		]);
	});

	it('makes the file name writable before the lookup', async () => {
		const file = new File(['x'], 'x.txt', { type: 'text/plain' });
		const chat = createGoldenChat();

		await uploadFiles(chat, { files: [file] });

		expect(Object.getOwnPropertyDescriptor(file, 'name')).toMatchObject({ writable: true, value: 'x.txt' });
	});

	it('sends no file and still focuses when the list is empty', async () => {
		const chat = createGoldenChat();

		await uploadFiles(chat, { files: [] });

		expect(getCalls().slice(2)).toEqual([['chat.action.performContinuously', 'uploading'], ['chat.composer.focus']]);
	});

	it('does not need resetFileInput', async () => {
		const chat = createGoldenChat();

		await uploadFiles(chat, { files: [a] });

		expect(getCalls().map(([fn]) => fn)).not.toContain('resetFileInput');
	});

	it('keeps going and focuses when one send rejects', async () => {
		behavior.uploadSend = async (file) => {
			if (file === a) {
				throw new Error('send failed');
			}
		};
		const chat = createGoldenChat();

		await expect(uploadFiles(chat, { files: [a, b] })).resolves.toBeUndefined();

		expect(getCalls().slice(-3)).toEqual([
			['chat.composer.uploads.send', a, undefined],
			['chat.composer.uploads.send', b, undefined],
			['chat.composer.focus'],
		]);
	});

	it('sends the plain file when the room has an e2e instance but encrypting files is off', async () => {
		behavior.e2eRoom = encryptedRoom();
		const chat = createGoldenChat();

		await uploadFiles(chat, { files: [a] });

		expect(getCalls().slice(3)).toEqual([
			['e2e.getInstanceByRoomId', 'GENERAL'],
			['settings.peek', 'E2E_Enable_Encrypt_Files'],
			['chat.composer.uploads.send', a, undefined],
			['chat.composer.focus'],
		]);
	});
});

describe('uploadFiles golden: encrypted files', () => {
	beforeEach(() => {
		behavior.settings.E2E_Enable_Encrypt_Files = true;
		behavior.e2eRoom = encryptedRoom();
	});

	it('encrypts the file and its metadata, then sends the blob with the raw file and content', async () => {
		const chat = createGoldenChat();
		const content = {
			type: 'text/plain',
			typeGroup: 'text',
			name: 'a.txt',
			encryption: { key: { k: 'key' }, iv: 'iv' },
			hashes: { sha256: 'hash' },
		};

		await uploadFiles(chat, { files: [a] });

		const [, sent] = getCalls().find(([fn]) => fn === 'chat.composer.uploads.send') as [string, File, unknown];
		expect(getCalls().slice(3)).toEqual([
			['e2e.getInstanceByRoomId', 'GENERAL'],
			['settings.peek', 'E2E_Enable_Encrypt_Files'],
			['e2eRoom.encryptFile', a],
			['e2eRoom.isReady'],
			['e2eRoom.encryptMessageContent', content],
			[
				'chat.composer.uploads.send',
				sent,
				{
					rawFile: a,
					fileContent: { raw: content, encrypted: { algorithm: 'rc.v1.aes-sha2', ciphertext: 'cipher' } },
					encryptedFile: expect.objectContaining({ iv: 'iv', hash: 'hash', key: { k: 'key' } }),
				},
			],
			['chat.composer.focus'],
		]);
		expect(sent.type).toBe('application/octet-stream');
	});

	it('toasts and sends nothing when the room is not ready', async () => {
		behavior.e2eRoom = encryptedRoom({
			isReady: () => {
				record('e2eRoom.isReady');
				return false;
			},
		});
		const chat = createGoldenChat();

		await uploadFiles(chat, { files: [a] });

		expect(getCalls().slice(5)).toEqual([
			['e2eRoom.encryptFile', a],
			['e2eRoom.isReady'],
			['toast', { type: 'error', message: 'Error_encrypting_file' }],
			['chat.composer.focus'],
		]);
	});

	it('toasts and sends nothing when encryption returns nothing', async () => {
		behavior.e2eRoom = encryptedRoom({
			encryptFile: async (file: File) => {
				record('e2eRoom.encryptFile', file);
				return undefined;
			},
		});
		const chat = createGoldenChat();

		await uploadFiles(chat, { files: [a] });

		expect(getCalls().slice(-4)).toEqual([
			['e2eRoom.encryptFile', a],
			['e2eRoom.isReady'],
			['toast', { type: 'error', message: 'Error_encrypting_file' }],
			['chat.composer.focus'],
		]);
	});

	it('swallows an encryption error and still focuses the composer', async () => {
		behavior.e2eRoom = encryptedRoom({
			encryptFile: async () => {
				throw new Error('crypto failure');
			},
		});
		const chat = createGoldenChat();

		await expect(uploadFiles(chat, { files: [a] })).resolves.toBeUndefined();

		expect(getCalls().at(-1)).toEqual(['chat.composer.focus']);
		expect(getCalls().map(([fn]) => fn)).not.toContain('toast');
	});
});
