import * as assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type { IUser } from '../../../src/definition/users';
import type { IUpload } from '../../../src/definition/uploads';
import type { IUploadDescriptor } from '../../../src/definition/uploads/IUploadDescriptor';
import { UploadCreator } from '../../../src/server/accessors/UploadCreator';
import type { AppBridges, UploadBridge, UserBridge } from '../../../src/server/bridges';
import { TestData } from '../../test-data/utilities';

describe('UploadCreator', () => {
	let mockAppId: string;
	let mockUploadBridge: UploadBridge;
	let mockUserBridge: UserBridge;
	let mockBridges: AppBridges;

	beforeEach(() => {
		mockAppId = 'testing-app';

		mockUploadBridge = {
			doCreateUpload(details: any, buffer: Buffer, appId: string): Promise<IUpload> {
				return Promise.resolve({ id: 'upload-1' } as IUpload);
			},
		} as UploadBridge;

		mockUserBridge = {
			doGetAppUser(appId?: string): Promise<IUser | undefined> {
				return Promise.resolve(TestData.getUser('app-user', 'app.user'));
			},
		} as UserBridge;

		const uplBridge = mockUploadBridge;
		const usrBridge = mockUserBridge;
		mockBridges = {
			getUploadBridge: () => uplBridge,
			getUserBridge: () => usrBridge,
		} as AppBridges;
	});

	afterEach(() => {
		mock.restoreAll();
	});

	it('uploads with user in descriptor', async () => {
		const uc = new UploadCreator(mockBridges, mockAppId);
		const spUpload = mock.method(mockUploadBridge, 'doCreateUpload');
		const spUser = mock.method(mockUserBridge, 'doGetAppUser');

		const user = TestData.getUser();
		const room = TestData.getRoom();
		const buffer = Buffer.from('file-content');

		const descriptor: IUploadDescriptor = {
			filename: 'test.txt',
			room,
			user,
		};

		const result = await uc.uploadBuffer(buffer, descriptor);

		assert.strictEqual(result.id, 'upload-1');
		assert.strictEqual(spUser.mock.calls.length, 0);
		assert.strictEqual(spUpload.mock.calls.length, 1);

		const [details, passedBuffer, appId] = spUpload.mock.calls[0].arguments;
		assert.strictEqual(details.name, 'test.txt');
		assert.strictEqual(details.size, buffer.length);
		assert.strictEqual(details.rid, room.id);
		assert.strictEqual(details.userId, user.id);
		assert.strictEqual(details.visitorToken, undefined);
		assert.strictEqual(passedBuffer, buffer);
		assert.strictEqual(appId, mockAppId);
	});

	it('fetches app user when no user in descriptor', async () => {
		const uc = new UploadCreator(mockBridges, mockAppId);
		const spUpload = mock.method(mockUploadBridge, 'doCreateUpload');
		const spUser = mock.method(mockUserBridge, 'doGetAppUser');

		const room = TestData.getRoom();
		const buffer = Buffer.from('file-content');

		const descriptor: IUploadDescriptor = {
			filename: 'test.txt',
			room,
		};

		await uc.uploadBuffer(buffer, descriptor);

		assert.strictEqual(spUser.mock.calls.length, 1);
		assert.deepStrictEqual(spUser.mock.calls[0].arguments, [mockAppId]);

		const [details] = spUpload.mock.calls[0].arguments;
		assert.strictEqual(details.userId, 'app-user');
	});

	it('skips user fetch when user is explicitly undefined (hasOwnProperty)', async () => {
		const uc = new UploadCreator(mockBridges, mockAppId);
		const spUpload = mock.method(mockUploadBridge, 'doCreateUpload');
		const spUser = mock.method(mockUserBridge, 'doGetAppUser');

		const room = TestData.getRoom();
		const buffer = Buffer.from('file-content');

		const descriptor: IUploadDescriptor = {
			filename: 'test.txt',
			room,
			user: undefined,
		};

		await uc.uploadBuffer(buffer, descriptor);

		assert.strictEqual(spUser.mock.calls.length, 0);

		const [details] = spUpload.mock.calls[0].arguments;
		assert.strictEqual(details.userId, undefined);
	});

	it('skips user fetch when visitorToken is present', async () => {
		const uc = new UploadCreator(mockBridges, mockAppId);
		const spUpload = mock.method(mockUploadBridge, 'doCreateUpload');
		const spUser = mock.method(mockUserBridge, 'doGetAppUser');

		const room = TestData.getRoom();
		const buffer = Buffer.from('visitor-upload');

		const descriptor: IUploadDescriptor = {
			filename: 'visitor-file.txt',
			room,
			visitorToken: 'visitor-token-123',
		};

		await uc.uploadBuffer(buffer, descriptor);

		assert.strictEqual(spUser.mock.calls.length, 0);

		const [details] = spUpload.mock.calls[0].arguments;
		assert.strictEqual(details.visitorToken, 'visitor-token-123');
		assert.strictEqual(details.userId, undefined);
	});

	it('handles doGetAppUser returning undefined', async () => {
		const uc = new UploadCreator(mockBridges, mockAppId);
		const spUpload = mock.method(mockUploadBridge, 'doCreateUpload');
		mock.method(mockUserBridge, 'doGetAppUser', () => Promise.resolve(undefined));

		const room = TestData.getRoom();
		const buffer = Buffer.from('file-content');

		const descriptor: IUploadDescriptor = {
			filename: 'test.txt',
			room,
		};

		await uc.uploadBuffer(buffer, descriptor);

		const [details] = spUpload.mock.calls[0].arguments;
		assert.strictEqual(details.userId, undefined);
	});

	it('passes correct buffer size', async () => {
		const uc = new UploadCreator(mockBridges, mockAppId);
		const spUpload = mock.method(mockUploadBridge, 'doCreateUpload');

		const room = TestData.getRoom();
		const user = TestData.getUser();
		const buffer = Buffer.alloc(1024);

		const descriptor: IUploadDescriptor = {
			filename: 'sized-file.bin',
			room,
			user,
		};

		await uc.uploadBuffer(buffer, descriptor);

		const [details] = spUpload.mock.calls[0].arguments;
		assert.strictEqual(details.size, 1024);
	});
});
