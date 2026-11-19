import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const removeUpload = sinon.stub();
const getStore = sinon.stub().returns({ deleteById: removeUpload });
const getVisitorByToken = sinon.stub();
const findOneOpenByRoomIdAndVisitorToken = sinon.stub();
const sendMessageLivechat = sinon.stub();

const { sendFileLivechatMessage } = proxyquire.noCallThru().load('./sendFileLivechatMessage.ts', {
	'@rocket.chat/models': {
		LivechatVisitors: { getVisitorByToken },
		LivechatRooms: { findOneOpenByRoomIdAndVisitorToken },
	},
	'@rocket.chat/random': { Random: { id: sinon.stub().returns('message-one') } },
	'meteor/check': { Match: { Optional: (value: unknown) => value }, check: sinon.stub() },
	'./sendMessageLivechat': { sendMessageLivechat },
	'../../lib/media/file-upload': {
		FileUpload: {
			getStore,
			getPath: sinon.stub().returns('/file/url'),
			resizeImagePreview: sinon.stub().resolves(undefined),
		},
	},
});

describe('sendFileLivechatMessage', () => {
	const file = { _id: 'upload-one', name: 'file.txt', type: 'text/plain', size: 3 };

	beforeEach(() => {
		removeUpload.reset();
		removeUpload.resolves();
		getStore.resetHistory();
		getVisitorByToken.reset();
		findOneOpenByRoomIdAndVisitorToken.reset();
		sendMessageLivechat.reset();
		getVisitorByToken.resolves({ _id: 'visitor-one', token: 'visitor-token' });
		findOneOpenByRoomIdAndVisitorToken.resolves({ _id: 'room-one' });
		sendMessageLivechat.resolves(true);
	});

	it('sends the file message and keeps the upload when the room is still open', async () => {
		expect(await sendFileLivechatMessage({ roomId: 'room-one', visitorToken: 'visitor-token', file })).to.be.true;

		expect(findOneOpenByRoomIdAndVisitorToken.calledOnceWithExactly('room-one', 'visitor-token')).to.be.true;
		expect(sendMessageLivechat.calledOnce).to.be.true;
		expect(sendMessageLivechat.firstCall.args[0].message.file._id).to.equal('upload-one');
		expect(removeUpload.notCalled).to.be.true;
	});

	it('removes the stored upload when the guest history was removed after the file was stored', async () => {
		findOneOpenByRoomIdAndVisitorToken.resolves(null);

		expect(await sendFileLivechatMessage({ roomId: 'room-one', visitorToken: 'visitor-token', file })).to.be.false;

		expect(removeUpload.calledOnceWithExactly('upload-one')).to.be.true;
		expect(sendMessageLivechat.notCalled).to.be.true;
	});

	it('removes the stored upload when the visitor no longer exists', async () => {
		getVisitorByToken.resolves(null);

		expect(await sendFileLivechatMessage({ roomId: 'room-one', visitorToken: 'visitor-token', file })).to.be.false;

		expect(findOneOpenByRoomIdAndVisitorToken.notCalled).to.be.true;
		expect(removeUpload.calledOnceWithExactly('upload-one')).to.be.true;
		expect(sendMessageLivechat.notCalled).to.be.true;
	});

	it('propagates a failure to remove the rejected upload', async () => {
		findOneOpenByRoomIdAndVisitorToken.resolves(null);
		removeUpload.rejects(new Error('upload store unavailable'));

		await expect(sendFileLivechatMessage({ roomId: 'room-one', visitorToken: 'visitor-token', file })).to.be.rejectedWith(
			'upload store unavailable',
		);
		expect(sendMessageLivechat.notCalled).to.be.true;
	});
});
