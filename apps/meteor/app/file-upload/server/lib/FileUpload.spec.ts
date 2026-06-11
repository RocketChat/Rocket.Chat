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

		describe('livechat room-based authorization (rc_room_type=l)', () => {
			it('should allow access when livechat credentials are valid and file belongs to the same room', async () => {
				settingsGetMap.set('FileUpload_ProtectFiles', true);
				const canAccessUploadedFileStub = sinon.stub().resolves(true);
				roomCoordinatorStub.getRoomDirectives.returns({ canAccessUploadedFile: canAccessUploadedFileStub });

				const request = {
					headers: {},
					url: '/file-upload/test-file-id/test-file.png?rc_room_type=l&rc_rid=room-1&rc_token=visitor-token',
				} as any;

				const file = { _id: 'test-file-id', rid: 'room-1' } as any;

				const result = await FileUpload.requestCanAccessFiles(request, file);
				expect(result).to.be.true;
				expect(canAccessUploadedFileStub.calledOnce).to.be.true;
			});

			it('should deny access when livechat credentials are valid but file belongs to a different room', async () => {
				settingsGetMap.set('FileUpload_ProtectFiles', true);
				const canAccessUploadedFileStub = sinon.stub().resolves(false);
				roomCoordinatorStub.getRoomDirectives.returns({ canAccessUploadedFile: canAccessUploadedFileStub });

				const request = {
					headers: {},
					url: '/file-upload/victim-file-id/secret.txt?rc_room_type=l&rc_rid=room-attacker&rc_token=attacker-token',
				} as any;

				// File belongs to victim's room, not the attacker's room
				const file = { _id: 'victim-file-id', rid: 'room-victim' } as any;

				const result = await FileUpload.requestCanAccessFiles(request, file);
				expect(result).to.be.false;
			});

			it('should pass the file object to canAccessUploadedFile', async () => {
				settingsGetMap.set('FileUpload_ProtectFiles', true);
				const canAccessUploadedFileStub = sinon.stub().resolves(true);
				roomCoordinatorStub.getRoomDirectives.returns({ canAccessUploadedFile: canAccessUploadedFileStub });

				const request = {
					headers: {},
					url: '/file-upload/test-file-id/test-file.png?rc_room_type=l&rc_rid=room-1&rc_token=visitor-token',
				} as any;

				const file = { _id: 'test-file-id', rid: 'room-1' } as any;

				await FileUpload.requestCanAccessFiles(request, file);

				const callArgs = canAccessUploadedFileStub.firstCall.args;
				expect(callArgs[1]).to.deep.equal(file);
			});

			it('should deny access when rc_room_type is provided but canAccessUploadedFile returns false', async () => {
				settingsGetMap.set('FileUpload_ProtectFiles', true);
				const canAccessUploadedFileStub = sinon.stub().resolves(false);
				roomCoordinatorStub.getRoomDirectives.returns({ canAccessUploadedFile: canAccessUploadedFileStub });

				const request = {
					headers: {},
					url: '/file-upload/test-file-id/test-file.png?rc_room_type=l&rc_rid=room-1&rc_token=invalid-token',
				} as any;

				const file = { _id: 'test-file-id', rid: 'room-1' } as any;

				const result = await FileUpload.requestCanAccessFiles(request, file);
				expect(result).to.be.false;
			});
		});
	});

	describe('getRequestUserId', () => {
		it('should return undefined when no url is provided', async () => {
			const request = { headers: {}, url: undefined } as any;

			const result = await FileUpload.getRequestUserId(request);
			expect(result).to.be.undefined;
			expect(usersModelStub.findOneByIdAndLoginToken.called).to.be.false;
		});

		it('should return undefined when no credentials are provided', async () => {
			const request = { headers: {}, url: '/ufs/UserDataFiles/file-id' } as any;

			const result = await FileUpload.getRequestUserId(request);
			expect(result).to.be.undefined;
			expect(usersModelStub.findOneByIdAndLoginToken.called).to.be.false;
		});

		it('should return undefined when a uid is provided without a token', async () => {
			const request = { headers: { 'x-user-id': 'user-1' }, url: '/ufs/UserDataFiles/file-id' } as any;

			const result = await FileUpload.getRequestUserId(request);
			expect(result).to.be.undefined;
			expect(usersModelStub.findOneByIdAndLoginToken.called).to.be.false;
		});

		it('should return undefined when the login token is invalid', async () => {
			usersModelStub.findOneByIdAndLoginToken.resolves(null);

			const request = { headers: { 'x-user-id': 'user-1', 'x-auth-token': 'bad-token' }, url: '/ufs/UserDataFiles/file-id' } as any;

			const result = await FileUpload.getRequestUserId(request);
			expect(result).to.be.undefined;
			expect(usersModelStub.findOneByIdAndLoginToken.calledOnceWith('user-1', 'hashed_bad-token')).to.be.true;
		});

		it('should return the user id when credentials are valid via headers', async () => {
			usersModelStub.findOneByIdAndLoginToken.resolves({ _id: 'user-1' });

			const request = { headers: { 'x-user-id': 'user-1', 'x-auth-token': 'good-token' }, url: '/ufs/UserDataFiles/file-id' } as any;

			const result = await FileUpload.getRequestUserId(request);
			expect(result).to.equal('user-1');
			expect(usersModelStub.findOneByIdAndLoginToken.calledOnceWith('user-1', 'hashed_good-token')).to.be.true;
		});

		it('should return the user id when credentials are valid via query string', async () => {
			usersModelStub.findOneByIdAndLoginToken.resolves({ _id: 'user-1' });

			const request = { headers: {}, url: '/ufs/UserDataFiles/file-id?rc_uid=user-1&rc_token=good-token' } as any;

			const result = await FileUpload.getRequestUserId(request);
			expect(result).to.equal('user-1');
			expect(usersModelStub.findOneByIdAndLoginToken.calledOnceWith('user-1', 'hashed_good-token')).to.be.true;
		});
	});

	describe('UserDataFiles.onRead', () => {
		// eslint-disable-next-line new-cap
		const getOnRead = () => FileUpload.defaults.UserDataFiles().onRead;

		const createResponse = () => {
			const res = { writeHead: sinon.stub(), setHeader: sinon.stub() };
			res.writeHead.returns(res);
			return res as any;
		};

		it('should deny access to an unauthenticated request', async () => {
			const res = createResponse();
			const file = { _id: 'file-id', userId: 'owner-1', name: 'export.zip' } as any;
			const request = { headers: {}, url: '/ufs/UserDataFiles/file-id' } as any;

			const result = await getOnRead()('file-id', file, request, res);
			expect(result).to.be.false;
			expect(res.writeHead.calledOnceWith(403)).to.be.true;
			expect(res.setHeader.called).to.be.false;
		});

		it('should deny access to an authenticated user who is not the owner', async () => {
			usersModelStub.findOneByIdAndLoginToken.resolves({ _id: 'attacker-1' });

			const res = createResponse();
			const file = { _id: 'file-id', userId: 'owner-1', name: 'export.zip' } as any;
			const request = {
				headers: { 'x-user-id': 'attacker-1', 'x-auth-token': 'attacker-token' },
				url: '/ufs/UserDataFiles/file-id',
			} as any;

			const result = await getOnRead()('file-id', file, request, res);
			expect(result).to.be.false;
			expect(res.writeHead.calledOnceWith(403)).to.be.true;
			expect(res.setHeader.called).to.be.false;
		});

		it('should allow access to the owner of the export', async () => {
			usersModelStub.findOneByIdAndLoginToken.resolves({ _id: 'owner-1' });

			const res = createResponse();
			const file = { _id: 'file-id', userId: 'owner-1', name: 'export.zip' } as any;
			const request = {
				headers: { 'x-user-id': 'owner-1', 'x-auth-token': 'owner-token' },
				url: '/ufs/UserDataFiles/file-id',
			} as any;

			const result = await getOnRead()('file-id', file, request, res);
			expect(result).to.be.true;
			expect(res.writeHead.called).to.be.false;
			expect(res.setHeader.calledOnceWith('content-disposition', 'attachment; filename="export.zip"')).to.be.true;
		});
	});
});
