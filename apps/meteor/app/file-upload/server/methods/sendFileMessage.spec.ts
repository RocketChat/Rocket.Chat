import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const findOneByIdAndUserIdAndRoomId = sinon.stub();
const updateFileMetadata = sinon.stub().resolves();
const getPath = sinon.stub().returns('/path/to/file.txt');
const isImagePreviewSupported = sinon.stub().returns(false);
const getFileExtension = sinon.stub().returns('txt');

const { parseFileIntoMessageAttachments } = proxyquire.noCallThru().load('./sendFileMessage', {
	'@rocket.chat/models': {
		Uploads: { findOneByIdAndUserIdAndRoomId, updateFileMetadata },
		Rooms: { findOneById: sinon.stub() },
		Users: { findOneById: sinon.stub() },
	},
	'meteor/check': {
		check: sinon.stub(),
		Match: {
			Maybe: sinon.stub(),
			Optional: sinon.stub(),
			ObjectIncluding: sinon.stub(),
		},
	},
	'meteor/meteor': {
		Meteor: {
			Error: class Error extends global.Error {},
			methods: sinon.stub(),
		},
	},
	'../lib/FileUpload': {
		FileUpload: { getPath },
	},
	'./isImagePreviewSupported': { isImagePreviewSupported },
	'../../../../lib/utils/getFileExtension': { getFileExtension },
	'../../../../server/lib/callbacks': { callbacks: { runAsync: sinon.stub() } },
	'../../../../server/lib/logger/system': { SystemLogger: { error: sinon.stub() } },
	'../../../authorization/server/functions/canAccessRoom': { canAccessRoomAsync: sinon.stub().resolves(true) },
	'../../../lib/server/methods/sendMessage': { executeSendMessage: sinon.stub().resolves({}) },
});

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
