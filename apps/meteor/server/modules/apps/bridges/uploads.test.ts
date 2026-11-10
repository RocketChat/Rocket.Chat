import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const findOneById = sinon.stub();
const insert = sinon.stub();
const sendFileMessage = sinon.stub();
const sendFileLivechatMessage = sinon.stub();

const { AppUploadBridge } = proxyquire.noCallThru().load('./uploads', {
	'@rocket.chat/apps/dist/server/bridges/UploadBridge': { UploadBridge: class {} },
	'@rocket.chat/models': { Messages: { findOneById } },
	'../../../../ee/lib/misc/determineFileType': { determineFileType: () => 'text/plain' },
	'../../../lib/media/file-upload': { FileUpload: { getStore: () => ({ insert }) } },
	'../../../meteor-methods/messages/sendFileMessage': { sendFileMessage },
	'../../../meteor-methods/omnichannel/sendFileLivechatMessage': { sendFileLivechatMessage },
});

const orchestrator = {
	debugLog: () => undefined,
	getConverters: () => ({ get: () => ({ convertToApp: (file: unknown) => file }) }),
};

const buffer = Buffer.from('x');
const baseDetails = { name: 'f.txt', size: 1, type: '', rid: 'room-id', userId: 'user-id' };

describe('AppUploadBridge.createUpload', () => {
	let bridge: any;

	beforeEach(() => {
		for (const stub of [findOneById, insert, sendFileMessage, sendFileLivechatMessage]) {
			stub.reset();
		}
		insert.resolves({ _id: 'file-id' });
		bridge = new AppUploadBridge(orchestrator);
	});

	const expectNoUpload = () => {
		expect(insert.called).to.be.false;
		expect(sendFileMessage.called).to.be.false;
		expect(sendFileLivechatMessage.called).to.be.false;
	};

	it('passes msgData.tmid to sendFileMessage when threadId is set', async () => {
		findOneById.resolves({ _id: 'tm1', rid: 'room-id' });
		await bridge.createUpload({ ...baseDetails, threadId: 'tm1' }, buffer, 'app-id');
		expect(sendFileMessage.firstCall.args[1]).to.deep.equal({ roomId: 'room-id', file: { _id: 'file-id' }, msgData: { tmid: 'tm1' } });
		expect(insert.firstCall.args[0]).to.not.have.property('threadId');
	});

	it('passes no msgData without threadId', async () => {
		await bridge.createUpload({ ...baseDetails }, buffer, 'app-id');
		expect(sendFileMessage.firstCall.args[1]).to.not.have.property('msgData');
		expect(findOneById.called).to.be.false;
	});

	it('throws when the parent message is in another room', async () => {
		findOneById.resolves({ _id: 'tm1', rid: 'other-room' });
		await expect(bridge.createUpload({ ...baseDetails, threadId: 'tm1' }, buffer, 'app-id')).to.be.rejectedWith(Error);
		expectNoUpload();
	});

	it('throws when the parent message does not exist', async () => {
		findOneById.resolves(null);
		await expect(bridge.createUpload({ ...baseDetails, threadId: 'tm1' }, buffer, 'app-id')).to.be.rejectedWith(Error);
		expectNoUpload();
	});

	it('throws when a visitor upload sets threadId', async () => {
		const { userId, ...visitorDetails } = baseDetails;
		await expect(bridge.createUpload({ ...visitorDetails, visitorToken: 'vtok', threadId: 'tm1' }, buffer, 'app-id')).to.be.rejectedWith(
			Error,
		);
		expectNoUpload();
	});
});
