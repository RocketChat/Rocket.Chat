import { MeteorError } from '@rocket.chat/core-services';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const checkMock = sinon.stub();
const meteorUserIdMock = sinon.stub();
const meteorMethodsMock = sinon.stub();
const deleteMessageValidatingPermissionMock = sinon.stub();
const canDeleteFileMock = sinon.stub();
const deleteByIdMock = sinon.stub();
const fileUploadGetStoreMock = sinon.stub().returns({ deleteById: deleteByIdMock });

const modelsMock = {
	Messages: {
		getMessageByFileId: sinon.stub(),
	},
	Users: {
		findOneById: sinon.stub(),
	},
	Uploads: {
		findOneById: sinon.stub(),
	},
};

p.noCallThru().load('../../../../server/methods/deleteFileMessage', {
	'meteor/meteor': {
		Meteor: {
			userId: meteorUserIdMock,
			Error: MeteorError,
			methods: meteorMethodsMock,
		},
	},
	'meteor/check': {
		check: checkMock,
	},
	'@rocket.chat/models': modelsMock,
	'@rocket.chat/core-services': {
		Upload: { canDeleteFile: canDeleteFileMock },
	},
	'../../app/file-upload/server': {
		FileUpload: { getStore: fileUploadGetStoreMock },
	},
	'../../app/lib/server/functions/deleteMessage': {
		deleteMessageValidatingPermission: deleteMessageValidatingPermissionMock,
	},
});

const deleteFileMessageMethod = meteorMethodsMock.firstCall.args[0].deleteFileMessage;

describe('deleteFileMessage', () => {
	beforeEach(() => {
		checkMock.resetHistory();
		meteorUserIdMock.reset();
		deleteMessageValidatingPermissionMock.reset();
		canDeleteFileMock.reset();
		deleteByIdMock.reset();
		fileUploadGetStoreMock.resetHistory();
		modelsMock.Messages.getMessageByFileId.reset();
		modelsMock.Users.findOneById.reset();
		modelsMock.Uploads.findOneById.reset();
	});

	it('should throw if user is not authenticated', async () => {
		meteorUserIdMock.returns(null);

		await expect(deleteFileMessageMethod('file123')).to.be.rejectedWith('Invalid user');
	});

	it('should delete message validating permission if file has an associated message', async () => {
		meteorUserIdMock.returns('user123');
		const mockMsg = { _id: 'msg123', file: { _id: 'file123' } };
		modelsMock.Messages.getMessageByFileId.resolves(mockMsg);
		deleteMessageValidatingPermissionMock.resolves();

		await deleteFileMessageMethod('file123');

		expect(checkMock.calledOnceWith('file123', String)).to.be.true;
		expect(deleteMessageValidatingPermissionMock.calledOnceWith(mockMsg, 'user123')).to.be.true;
		expect(modelsMock.Users.findOneById.called).to.be.false;
	});

	it('should throw if it is an orphan file but user is not found in DB', async () => {
		meteorUserIdMock.returns('user123');
		modelsMock.Messages.getMessageByFileId.resolves(null);
		modelsMock.Users.findOneById.resolves(null);

		await expect(deleteFileMessageMethod('file123')).to.be.rejectedWith('Invalid user');
	});

	it('should throw if it is an orphan file but file is not found in DB', async () => {
		meteorUserIdMock.returns('user123');
		modelsMock.Messages.getMessageByFileId.resolves(null);
		modelsMock.Users.findOneById.resolves({ _id: 'user123', username: 'test' });
		modelsMock.Uploads.findOneById.resolves(null);

		await expect(deleteFileMessageMethod('file123')).to.be.rejectedWith('Invalid file');
	});

	it('should not delete orphan file if user does not have permissions', async () => {
		meteorUserIdMock.returns('user123');
		modelsMock.Messages.getMessageByFileId.resolves(null);
		modelsMock.Users.findOneById.resolves({ _id: 'user123', username: 'test' });
		modelsMock.Uploads.findOneById.resolves({ _id: 'file123', userId: 'user123' });
		canDeleteFileMock.resolves(false);

		await expect(deleteFileMessageMethod('file123')).to.be.rejectedWith('Not authorized');
	});

	it('should delete orphan file if user has permissions', async () => {
		meteorUserIdMock.returns('user123');
		modelsMock.Messages.getMessageByFileId.resolves(null);
		modelsMock.Users.findOneById.resolves({ _id: 'user123', username: 'test' });
		modelsMock.Uploads.findOneById.resolves({ _id: 'file123', userId: 'user123' });
		canDeleteFileMock.resolves(true);
		deleteByIdMock.resolves();

		await deleteFileMessageMethod('file123');

		expect(fileUploadGetStoreMock.calledOnceWith('Uploads')).to.be.true;
		expect(deleteByIdMock.calledOnceWith('file123')).to.be.true;
	});
});
