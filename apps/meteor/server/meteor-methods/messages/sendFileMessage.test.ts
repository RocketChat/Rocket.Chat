import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const findOneByIdAndUserIdAndRoomId = sinon.stub();
const updateFileMetadata = sinon.stub().resolves();
const getPath = sinon.stub().returns('/path/to/file.txt');
const isImagePreviewSupported = sinon.stub().returns(false);
const getFileExtension = sinon.stub().returns('txt');

const executeSendMessage = sinon.stub().resolves({});

const { parseFileIntoMessageAttachments, sendFileMessage } = proxyquire.noCallThru().load('./sendFileMessage', {
	'@rocket.chat/models': {
		Uploads: { findOneByIdAndUserIdAndRoomId, updateFileMetadata },
		Rooms: { findOneById: sinon.stub().resolves({ _id: 'room123' }) },
		Users: { findOneById: sinon.stub().resolves({ _id: 'user123' }) },
	},
	'meteor/meteor': {
		Meteor: {
			methods: sinon.stub(),
		},
	},
	'../../lib/media/file-upload/lib/FileUpload': {
		FileUpload: { getPath },
	},
	'../../lib/media/file-upload/isImagePreviewSupported': { isImagePreviewSupported },
	'../../../lib/utils/getFileExtension': { getFileExtension },
	'../../lib/callbacks': { callbacks: { runAsync: sinon.stub() } },
	'../../lib/logger/system': { SystemLogger: { error: sinon.stub() } },
	'../../lib/authorization/canAccessRoom': { canAccessRoomAsync: sinon.stub().resolves(true) },
	'./sendMessage': { executeSendMessage },
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

describe('sendFileMessage - msgData validation', () => {
	const file = { _id: 'file123', name: 'file.txt', type: 'text/plain', size: 10 };

	beforeEach(() => {
		executeSendMessage.resetHistory();
		findOneByIdAndUserIdAndRoomId.resolves({ _id: 'file123' });
	});

	it('should send the message when msgData only has allowed fields', async () => {
		await sendFileMessage('user123', {
			roomId: 'room123',
			file,
			msgData: { msg: 'hi', groupable: true, content: { algorithm: 'rc.v1.aes-sha2', ciphertext: 'x' } },
		});

		expect(executeSendMessage.calledOnce).to.equal(true);
	});

	for (const msgData of [{ u: { _id: 'other' } }, { msg: 1 }, { groupable: 'true' }, { content: { algorithm: 'a' } }, { content: null }]) {
		it(`should reject msgData ${JSON.stringify(msgData)}`, async () => {
			await expect(sendFileMessage('user123', { roomId: 'room123', file, msgData })).to.be.rejectedWith('Invalid arguments');
			expect(executeSendMessage.called).to.equal(false);
		});
	}
});
