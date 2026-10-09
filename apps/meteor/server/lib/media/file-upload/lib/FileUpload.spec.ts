import { once } from 'node:events';
import { PassThrough, Readable } from 'node:stream';
import { text } from 'node:stream/consumers';

import { expect } from 'chai';
import { before, beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { createFakeMessageWithAttachment } from '../../../../../tests/mocks/data';

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
	'../../../i18n': sinon.stub(),
	'../../../logger/system': { SystemLogger: systemLoggerStub },
	'../../../rooms/roomCoordinator': { roomCoordinator: roomCoordinatorStub },
	'../../../../ufs': sinon.stub(),
	'../../../../ufs/ufs-methods': sinon.stub(),
	'../../../../settings': { settings: settingsStub },
	'../../../../../app/utils/lib/mimeTypes': sinon.stub(),
	'../../../utils/getURL': { getURL: sinon.stub() },
	'../../../utils/lib/JWTHelper': {
		validateAndDecodeJWT: validateAndDecodeJWTStub,
		generateJWT: sinon.stub(),
	},
	'../../../utils/restrictions': sinon.stub(),
	'../../../../api/lib/MultipartUploadHandler': sinon.stub(),
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

	describe('proxyFile', () => {
		const fileUrl = 'https://bucket.s3.amazonaws.com/file-id?X-Amz-Signature=abc';

		const createUpstream = (statusCode: number, headers: Record<string, string>, body = '') => {
			const fileRes = Object.assign(Readable.from([Buffer.from(body)]), { statusCode, headers });
			return { get: sinon.stub().callsFake((_url, _options, callback) => callback(fileRes)) };
		};

		const createResponse = () => {
			const headers = new Map<string, string>();
			const res = Object.assign(new PassThrough(), {
				statusCode: 200,
				setHeader: (name: string, value: string | number) => headers.set(name.toLowerCase(), String(value)),
				removeHeader: (name: string) => headers.delete(name.toLowerCase()),
				writeHead(statusCode: number) {
					res.statusCode = statusCode;
					return res;
				},
			});
			return { res: res as any, headers, body: text(res) };
		};

		it('should forward the requested byte range and relay the partial response', async () => {
			const request = createUpstream(
				206,
				{
					'accept-ranges': 'bytes',
					'content-length': '4',
					'content-range': 'bytes 2-5/720467',
					'content-type': 'audio/mpeg',
					'etag': '"abc"',
					'x-amz-request-id': 'internal',
				},
				'data',
			);
			const { res, headers, body } = createResponse();
			const req = { headers: { 'range': 'bytes=2-5', 'if-range': '"abc"', 'cookie': 'rc_token=secret' } } as any;

			FileUpload.proxyFile('Audio record.mp3', fileUrl, false, request, req, res);

			expect(request.get.firstCall.args[1]).to.deep.equal({ headers: { 'range': 'bytes=2-5', 'if-range': '"abc"' } });
			expect(await body).to.equal('data');
			expect(res.statusCode).to.equal(206);
			expect(Object.fromEntries(headers)).to.deep.equal({
				'content-disposition': 'inline; filename="Audio%20record.mp3"',
				'accept-ranges': 'bytes',
				'content-length': '4',
				'content-range': 'bytes 2-5/720467',
				'content-type': 'audio/mpeg',
				'etag': '"abc"',
			});
		});

		it('should relay the whole file when no range is requested', async () => {
			const request = createUpstream(200, { 'accept-ranges': 'bytes', 'content-length': '4', 'content-type': 'audio/mpeg' }, 'data');
			const { res, headers, body } = createResponse();

			FileUpload.proxyFile('audio.mp3', fileUrl, true, request, { headers: {} } as any, res);

			expect(request.get.firstCall.args[1]).to.deep.equal({ headers: {} });
			expect(await body).to.equal('data');
			expect(res.statusCode).to.equal(200);
			expect(headers.get('content-disposition')).to.equal('attachment; filename="audio.mp3"');
			expect(headers.get('accept-ranges')).to.equal('bytes');
			expect(headers.get('content-length')).to.equal('4');
		});

		it('should answer an unsatisfiable range with 416 and the file size', async () => {
			const request = createUpstream(416, { 'content-range': 'bytes */720467' }, '<Error/>');
			const { res, headers, body } = createResponse();

			FileUpload.proxyFile('audio.mp3', fileUrl, false, request, { headers: { range: 'bytes=999999-' } } as any, res);

			expect(await body).to.equal('');
			expect(res.statusCode).to.equal(416);
			expect(headers.get('content-range')).to.equal('bytes */720467');
		});

		it('should fail with 500 when the storage refuses the request', async () => {
			const request = createUpstream(403, { 'content-type': 'application/xml' }, '<Error/>');
			const { res, headers, body } = createResponse();

			FileUpload.proxyFile('audio.mp3', fileUrl, false, request, { headers: {} } as any, res);

			expect(await body).to.equal('');
			expect(res.statusCode).to.equal(500);
			expect(headers.get('x-rc-proxyfile-status')).to.equal('403');
			expect(headers.has('content-type')).to.be.false;
		});

		it('should release the storage response when the client goes away', async () => {
			const fileRes = Object.assign(new PassThrough(), { statusCode: 200, headers: {} });
			const res = Object.assign(new PassThrough(), { setHeader: sinon.stub() });

			FileUpload.proxyFile('audio.mp3', fileUrl, false, { get: sinon.stub().yields(fileRes) }, { headers: {} } as any, res);
			res.destroy();
			await once(res, 'close');

			expect(fileRes.destroyed).to.be.true;
		});
	});
});
