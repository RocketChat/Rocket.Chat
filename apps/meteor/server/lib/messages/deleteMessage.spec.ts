import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	Messages: {
		findOneById: sinon.stub(),
		decreaseReplyCountById: sinon.stub(),
		unsetThreadByIdIfEmpty: sinon.stub(),
		cloneAndSaveAsHistoryById: sinon.stub(),
		setHiddenById: sinon.stub(),
		removeById: sinon.stub(),
		setAsDeletedByIdAndUser: sinon.stub(),
		getLastVisibleUserMessageSentByRoomId: sinon.stub(),
	},
	Rooms: {
		findOneById: sinon.stub(),
		resetLastMessageById: sinon.stub(),
		decreaseMessageCountById: sinon.stub(),
	},
	Subscriptions: {
		removeUnreadThreadsByRoomId: sinon.stub(),
	},
	ReadReceipts: {
		removeByMessageId: sinon.stub(),
	},
	ReadReceiptsArchive: {
		removeByMessageId: sinon.stub(),
	},
	Uploads: {},
	Users: {},
};

const notifyOnMessageChangeMock = sinon.stub();

const { deleteMessage } = proxyquire.noCallThru().load('./deleteMessage', {
	'@rocket.chat/apps': {
		AppEvents: {},
		Apps: {},
	},
	'@rocket.chat/core-services': {
		api: { broadcast: sinon.stub() },
		Message: { beforeDelete: sinon.stub() },
	},
	'@rocket.chat/models': modelsMock,
	'meteor/meteor': {
		Meteor: {},
	},
	'../../settings': {
		settings: { get: sinon.stub().returns(false) },
	},
	'../authorization/canDeleteMessage': {
		canDeleteMessageAsync: sinon.stub(),
	},
	'../callbacks': {
		callbacks: { run: sinon.stub() },
	},
	'../media/file-upload': {
		FileUpload: {},
	},
	'../notifyListener': {
		notifyOnRoomChangedById: sinon.stub(),
		notifyOnMessageChange: notifyOnMessageChangeMock,
		notifyOnSubscriptionChangedByRoomIdAndUserIds: sinon.stub(),
	},
});

describe('deleteMessage', () => {
	const user = { _id: 'userId', username: 'user', name: 'User' };
	const room = { _id: 'roomId' };
	const reply = { _id: 'replyId', rid: 'roomId', tmid: 'parentId', msg: 'reply', ts: new Date(), u: user };

	beforeEach(() => {
		Object.values(modelsMock).forEach((model) => Object.values(model).forEach((stub: sinon.SinonStub) => stub.reset()));
		notifyOnMessageChangeMock.reset();

		modelsMock.Messages.findOneById.resolves(reply);
		modelsMock.Rooms.findOneById.resolves(room);
		modelsMock.Subscriptions.removeUnreadThreadsByRoomId.resolves({ modifiedCount: 0 });
	});

	describe('when deleting a thread reply', () => {
		it('should unset the thread fields on the parent message when its last reply is deleted', async () => {
			modelsMock.Messages.decreaseReplyCountById.resolves({ _id: 'parentId', tcount: 0 });

			await deleteMessage(reply, user);

			expect(modelsMock.Messages.decreaseReplyCountById.calledOnceWith('parentId', -1)).to.be.true;
			expect(modelsMock.Messages.unsetThreadByIdIfEmpty.calledOnceWith('parentId')).to.be.true;
			expect(notifyOnMessageChangeMock.calledWith({ id: 'parentId' })).to.be.true;
		});

		it('should keep the thread on the parent message while it still has replies', async () => {
			modelsMock.Messages.decreaseReplyCountById.resolves({ _id: 'parentId', tcount: 1 });

			await deleteMessage(reply, user);

			expect(modelsMock.Messages.decreaseReplyCountById.calledOnceWith('parentId', -1)).to.be.true;
			expect(modelsMock.Messages.unsetThreadByIdIfEmpty.called).to.be.false;
			expect(notifyOnMessageChangeMock.calledWith({ id: 'parentId' })).to.be.false;
		});
	});

	it('should not touch any thread when deleting a message outside of a thread', async () => {
		const message = { _id: 'messageId', rid: 'roomId', msg: 'message', ts: new Date(), u: user };
		modelsMock.Messages.findOneById.resolves(message);

		await deleteMessage(message, user);

		expect(modelsMock.Messages.decreaseReplyCountById.called).to.be.false;
		expect(modelsMock.Messages.unsetThreadByIdIfEmpty.called).to.be.false;
	});
});
