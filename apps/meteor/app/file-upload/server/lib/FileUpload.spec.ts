import { expect } from 'chai';
import { before, beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { createFakeMessageWithAttachment } from '../../../../tests/mocks/data';

const fakeStorageModel = { findOneById: sinon.stub(), deleteFile: sinon.stub() };
const settingsStub = { watch: sinon.stub(), get: sinon.stub() };
const settingsGetMap = new Map();
const messagesModelStub = {
	find: sinon.stub(),
};
const usersModelStub = {
	findOneByIdAndLoginToken: sinon.stub(),
};
const subscriptionsModelStub = {
	findOneByRoomIdAndUserId: sinon.stub(),
};
const validateAndDecodeJWTStub = sinon.stub();
const systemLoggerStub = {
	error: sinon.stub(),
};
const roomCoordinatorStub = {
	getRoomDirectives: sinon.stub(),
};

const { FileUpload, FileUploadClass } = proxyquire.noCallThru().load('./FileUpload', {
	'@rocket.chat/models': {
		Messages: messagesModelStub,
		Users: usersModelStub,
		Subscriptions: subscriptionsModelStub,
	},
	'meteor/check': sinon.stub(),
	'meteor/meteor': sinon.stub(),
	'meteor/ostrio:cookies': { Cookies: sinon.stub() },
	'sharp': sinon.stub(),
	'stream-buffers': sinon.stub(),
	'@rocket.chat/tools': sinon.stub(),
	'../../../../server/lib/i18n': sinon.stub(),
	'../../../../server/lib/logger/system': { SystemLogger: systemLoggerStub },
	'../../../../server/lib/rooms/roomCoordinator': { roomCoordinator: roomCoordinatorStub },
	'../../../../server/ufs': sinon.stub(),
	'../../../../server/ufs/ufs-methods': sinon.stub(),
	'../../../settings/server': { settings: settingsStub },
	'../../../utils/lib/mimeTypes': sinon.stub(),
	'../../../utils/server/lib/JWTHelper': {
		validateAndDecodeJWT: validateAndDecodeJWTStub,
		generateJWT: sinon.stub(),
	},
	'../../../utils/server/restrictions': sinon.stub(),
	'../../../api/server/lib/MultipartUploadHandler': sinon.stub(),
	'@rocket.chat/account-utils': { hashLoginToken: sinon.stub().callsFake((token) => `hashed_${token}`) },
});

describe('FileUpload', () => {
	before(() => {
		new FileUploadClass({ name: 'fakeStorage:Uploads', model: fakeStorageModel, store: {} });
		settingsGetMap.set('FileUpload_Storage_Type', 'fakeStorage');
		settingsStub.get.callsFake((settingName) => settingsGetMap.get(settingName));
	});

	beforeEach(() => {
		messagesModelStub.find.reset();
		fakeStorageModel.findOneById.reset();
		fakeStorageModel.deleteFile.reset();
		usersModelStub.findOneByIdAndLoginToken.reset();
		subscriptionsModelStub.findOneByRoomIdAndUserId.reset();
		validateAndDecodeJWTStub.reset();
		systemLoggerStub.error.reset();
		roomCoordinatorStub.getRoomDirectives.reset();
		settingsGetMap.clear();
		settingsGetMap.set('FileUpload_Storage_Type', 'fakeStorage');
	});

	it('should not remove any file if no room id is provided', async () => {
		expect(await FileUpload.removeFilesByRoomId()).to.be.undefined;

		expect(messagesModelStub.find.called).to.be.false;
		expect(fakeStorageModel.findOneById.called).to.be.false;
	});

	it('should not remove any file if an empty room id is provided', async () => {
		expect(await FileUpload.removeFilesByRoomId('')).to.be.undefined;

		expect(messagesModelStub.find.called).to.be.false;
		expect(fakeStorageModel.findOneById.called).to.be.false;
	});

	it('should not remove any file if an invalid room id is provided', async () => {
		messagesModelStub.find.returns([]);
		expect(await FileUpload.removeFilesByRoomId('invalid')).to.be.undefined;

		expect(messagesModelStub.find.called).to.be.true;
		expect(fakeStorageModel.findOneById.called).to.be.false;
	});

	it('should delete file from storage if message contains a single file', async () => {
		fakeStorageModel.findOneById.resolves({ _id: 'file-id', store: 'fakeStorage:Uploads' });

		const fakeMessage = createFakeMessageWithAttachment();
		messagesModelStub.find.returns([fakeMessage]);
		expect(await FileUpload.removeFilesByRoomId('invalid')).to.be.undefined;

		expect(messagesModelStub.find.called).to.be.true;
		expect(fakeStorageModel.findOneById.calledOnceWith(fakeMessage.files?.[0]._id)).to.be.true;
		expect(fakeStorageModel.deleteFile.calledOnceWith('file-id')).to.be.true;
	});

	it('should delete multiple files from storage if message contains many files (e.g. image and thumbnail)', async () => {
		fakeStorageModel.findOneById.callsFake((_id) => ({ _id, store: 'fakeStorage:Uploads' }));

		const fakeMessage = createFakeMessageWithAttachment({
			files: [
				{ _id: 'file-id', name: 'image', size: 100, type: 'image/png', format: 'png' },
				{ _id: 'thumbnail-id', name: 'thumbnail-image', size: 25, type: 'image/png', format: 'png' },
			],
		});
		messagesModelStub.find.returns([fakeMessage]);
		expect(await FileUpload.removeFilesByRoomId('invalid')).to.be.undefined;

		expect(messagesModelStub.find.called).to.be.true;
		expect(fakeStorageModel.findOneById.calledTwice).to.be.true;
		expect(fakeStorageModel.findOneById.calledWith('file-id')).to.be.true;
		expect(fakeStorageModel.findOneById.calledWith('thumbnail-id')).to.be.true;
		expect(fakeStorageModel.deleteFile.calledTwice).to.be.true;
		expect(fakeStorageModel.deleteFile.calledWith('file-id')).to.be.true;
		expect(fakeStorageModel.deleteFile.calledWith('thumbnail-id')).to.be.true;
	});

	describe('requestCanAccessFiles', () => {
		it('should allow access if FileUpload_ProtectFiles is false', async () => {
			settingsGetMap.set('FileUpload_ProtectFiles', false);

			const request = {
				headers: {},
				url: '/file-upload/test-file-id/test-file.png',
			} as any;

			const result = await FileUpload.requestCanAccessFiles(request);
			expect(result).to.be.true;
		});

		it('should allow access if no url is provided', async () => {
			settingsGetMap.set('FileUpload_ProtectFiles', true);

			const request = {
				headers: {},
				url: undefined,
			} as any;

			const result = await FileUpload.requestCanAccessFiles(request);
			expect(result).to.be.true;
		});

		it('should deny access if FileUpload_Enable_json_web_token_for_files is true but no token is provided', async () => {
			settingsGetMap.set('FileUpload_ProtectFiles', true);
			settingsGetMap.set('FileUpload_Enable_json_web_token_for_files', true);

			const request = {
				headers: {},
				url: '/file-upload/test-file-id/test-file.png',
			} as any;

			const file = {
				_id: 'test-file-id',
				rid: 'test-room-id',
			} as any;

			const result = await FileUpload.requestCanAccessFiles(request, file);
			expect(result).to.be.false;
		});

		it('should deny access if FileUpload_json_web_token_secret_for_files is not configured', async () => {
			settingsGetMap.set('FileUpload_ProtectFiles', true);
			settingsGetMap.set('FileUpload_Enable_json_web_token_for_files', true);
			settingsGetMap.set('FileUpload_json_web_token_secret_for_files', '');

			const request = {
				headers: {},
				url: '/file-upload/test-file-id/test-file.png?token=some-token',
			} as any;

			const file = {
				_id: 'test-file-id',
				rid: 'test-room-id',
			} as any;

			const result = await FileUpload.requestCanAccessFiles(request, file);
			expect(result).to.be.false;
			expect(systemLoggerStub.error.calledOnce).to.be.true;
		});

		it('should deny access if an invalid token is provided', async () => {
			settingsGetMap.set('FileUpload_ProtectFiles', true);
			settingsGetMap.set('FileUpload_Enable_json_web_token_for_files', true);
			settingsGetMap.set('FileUpload_json_web_token_secret_for_files', 'test-secret');
			validateAndDecodeJWTStub.returns(null);

			const request = {
				headers: {},
				url: '/file-upload/test-file-id/test-file.png?token=invalid-token',
			} as any;

			const file = {
				_id: 'test-file-id',
				rid: 'test-room-id',
			} as any;

			const result = await FileUpload.requestCanAccessFiles(request, file);
			expect(result).to.be.false;
			expect(validateAndDecodeJWTStub.calledOnce).to.be.true;
		});

		it('should deny access if token is invalid or payload cannot be decoded', async () => {
			settingsGetMap.set('FileUpload_ProtectFiles', true);
			settingsGetMap.set('FileUpload_Enable_json_web_token_for_files', true);
			settingsGetMap.set('FileUpload_json_web_token_secret_for_files', 'test-secret');
			validateAndDecodeJWTStub.returns(null);

			const request = {
				headers: {},
				url: '/file-upload/test-file-id/test-file.png?token=valid-token',
			} as any;

			const file = {
				_id: 'test-file-id',
				rid: 'test-room-id',
			} as any;

			const result = await FileUpload.requestCanAccessFiles(request, file);
			expect(result).to.be.false;
		});

		it('should deny access if the fileId and rid in the token do not match the requested file', async () => {
			settingsGetMap.set('FileUpload_ProtectFiles', true);
			settingsGetMap.set('FileUpload_Enable_json_web_token_for_files', true);
			settingsGetMap.set('FileUpload_json_web_token_secret_for_files', 'test-secret');
			validateAndDecodeJWTStub.returns({ fileId: 'different-file-id', rid: 'different-room-id', userId: 'test-user-id' });

			const request = {
				headers: {},
				url: '/file-upload/test-file-id/test-file.png?token=valid-token',
			} as any;

			const file = {
				_id: 'test-file-id',
				rid: 'test-room-id',
			} as any;

			const result = await FileUpload.requestCanAccessFiles(request, file);
			expect(result).to.be.false;
		});

		it('should deny access if file object is not provided when using JWT', async () => {
			settingsGetMap.set('FileUpload_ProtectFiles', true);
			settingsGetMap.set('FileUpload_Enable_json_web_token_for_files', true);
			settingsGetMap.set('FileUpload_json_web_token_secret_for_files', 'test-secret');
			validateAndDecodeJWTStub.returns({ fileId: 'test-file-id', rid: 'test-room-id', userId: 'test-user-id' });

			const request = {
				headers: {},
				url: '/file-upload/test-file-id/test-file.png?token=valid-token',
			} as any;

			const result = await FileUpload.requestCanAccessFiles(request, undefined);
			expect(result).to.be.false;
		});

		it('should allow access when everything is valid: token is valid, secret configured, and file/room match', async () => {
			settingsGetMap.set('FileUpload_ProtectFiles', true);
			settingsGetMap.set('FileUpload_Enable_json_web_token_for_files', true);
			settingsGetMap.set('FileUpload_json_web_token_secret_for_files', 'test-secret');
			validateAndDecodeJWTStub.returns({ fileId: 'test-file-id', rid: 'test-room-id', userId: 'test-user-id' });

			const request = {
				headers: {},
				url: '/file-upload/test-file-id/test-file.png?token=valid-token',
			} as any;

			const file = {
				_id: 'test-file-id',
				rid: 'test-room-id',
			} as any;

			const result = await FileUpload.requestCanAccessFiles(request, file);
			expect(result).to.be.true;
			expect(validateAndDecodeJWTStub.calledOnceWith('valid-token', 'test-secret')).to.be.true;
		});
	});
});
