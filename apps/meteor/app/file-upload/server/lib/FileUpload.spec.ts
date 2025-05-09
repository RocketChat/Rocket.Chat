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

const { FileUpload, FileUploadClass } = proxyquire.noCallThru().load('./FileUpload', {
	'@rocket.chat/models': {
		Messages: messagesModelStub,
	},
	'meteor/check': sinon.stub(),
	'meteor/meteor': sinon.stub(),
	'meteor/ostrio:cookies': { Cookies: sinon.stub() },
	'sharp': sinon.stub(),
	'stream-buffers': sinon.stub(),
	'./streamToBuffer': sinon.stub(),
	'../../../../server/lib/i18n': sinon.stub(),
	'../../../../server/lib/logger/system': sinon.stub(),
	'../../../../server/lib/rooms/roomCoordinator': sinon.stub(),
	'../../../../server/ufs': sinon.stub(),
	'../../../../server/ufs/ufs-methods': sinon.stub(),
	'../../../settings/server': { settings: settingsStub },
	'../../../utils/lib/mimeTypes': sinon.stub(),
	'../../../utils/server/lib/JWTHelper': sinon.stub(),
	'../../../utils/server/restrictions': sinon.stub(),
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
});
