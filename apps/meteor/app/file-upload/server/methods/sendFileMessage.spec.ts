import { expect } from 'chai';
import { describe, it, beforeEach, vi } from 'vitest';

const { stubs } = vi.hoisted(() => {
	const sinon = require('sinon');
	return {
		stubs: {
			findOneByIdAndUserIdAndRoomId: sinon.stub(),
			updateFileMetadata: sinon.stub().resolves(),
			getPath: sinon.stub().returns('/path/to/file.txt'),
			isImagePreviewSupported: sinon.stub().returns(false),
			getFileExtension: sinon.stub().returns('txt'),
			roomsFindOneById: sinon.stub(),
			usersFindOneById: sinon.stub(),
			callbacksRunAsync: sinon.stub(),
			systemLoggerError: sinon.stub(),
			canAccessRoomAsync: sinon.stub().resolves(true),
			executeSendMessage: sinon.stub().resolves({}),
			checkStub: sinon.stub(),
			meteorMethods: sinon.stub(),
		},
	};
});

const { findOneByIdAndUserIdAndRoomId } = stubs;
const { updateFileMetadata } = stubs;

vi.mock('@rocket.chat/models', () => ({
	Uploads: { findOneByIdAndUserIdAndRoomId: stubs.findOneByIdAndUserIdAndRoomId, updateFileMetadata: stubs.updateFileMetadata },
	Rooms: { findOneById: stubs.roomsFindOneById },
	Users: { findOneById: stubs.usersFindOneById },
}));
vi.mock('meteor/check', () => ({
	check: stubs.checkStub,
	Match: {
		Maybe: stubs.checkStub,
		Optional: stubs.checkStub,
		ObjectIncluding: stubs.checkStub,
	},
}));
vi.mock('meteor/meteor', () => ({
	Meteor: {
		Error: class Error extends global.Error {},
		methods: stubs.meteorMethods,
	},
}));
vi.mock('../lib/FileUpload', () => ({ FileUpload: { getPath: stubs.getPath } }));
vi.mock('./isImagePreviewSupported', () => ({ isImagePreviewSupported: stubs.isImagePreviewSupported }));
vi.mock('../../../../lib/utils/getFileExtension', () => ({ getFileExtension: stubs.getFileExtension }));
vi.mock('../../../../server/lib/callbacks', () => ({ callbacks: { runAsync: stubs.callbacksRunAsync } }));
vi.mock('../../../../server/lib/logger/system', () => ({ SystemLogger: { error: stubs.systemLoggerError } }));
vi.mock('../../../authorization/server/functions/canAccessRoom', () => ({ canAccessRoomAsync: stubs.canAccessRoomAsync }));
vi.mock('../../../lib/server/methods/sendMessage', () => ({ executeSendMessage: stubs.executeSendMessage }));

const { parseFileIntoMessageAttachments } = await import('./sendFileMessage');

describe('sendFileMessage - Mass Assignment & Type Pollution Prevention', () => {
	const mockUser = { _id: 'user123' };
	const roomId = 'room123';

	beforeEach(() => {
		findOneByIdAndUserIdAndRoomId.reset();
		updateFileMetadata.reset();

		findOneByIdAndUserIdAndRoomId.resolves({ _id: 'file123' });
	});

	it('should filter out invalid types, nulls, and malicious fields before updating the database', async () => {
		const maliciousFilePayload = {
			_id: 'file123',
			name: null, // invalid type, must be ignored
			type: 'text/plain',
			size: 1024,
			description: 12345, // invalid type, must be ignored
			typeGroup: 'image', // only valid field
			content: null, // invalid type, must be ignored
			maliciousRoleAssignment: 'admin', // mass assignment, must be ignored
			$set: { bypassSecurity: true }, // mongo injection, must be ignored
		};

		await parseFileIntoMessageAttachments(maliciousFilePayload as any, roomId, mockUser as any);

		expect(updateFileMetadata.calledOnce).to.equal(true);

		const [fileId, userId, safeMetadata] = updateFileMetadata.getCall(0).args;

		expect(fileId).to.equal('file123');
		expect(userId).to.equal('user123');

		expect(safeMetadata).to.deep.equal({
			typeGroup: 'image',
		});
	});

	it('should pass valid fields correctly to the database', async () => {
		const validFilePayload = {
			_id: 'file123',
			name: 'picture.jpg',
			type: 'image/jpeg',
			size: 2048,
			description: 'Description',
			typeGroup: 'image',
			content: {
				algorithm: 'rc.v1.aes-sha2',
				ciphertext: 'test',
			},
		};

		await parseFileIntoMessageAttachments(validFilePayload as any, roomId, mockUser as any);

		expect(updateFileMetadata.calledOnce).to.equal(true);

		const [, , safeMetadata] = updateFileMetadata.getCall(0).args;

		expect(safeMetadata).to.deep.equal({
			name: 'picture.jpg',
			description: 'Description',
			typeGroup: 'image',
			content: {
				algorithm: 'rc.v1.aes-sha2',
				ciphertext: 'test',
			},
		});
	});
});
