import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

import { createFakeMessage, createFakeRoom } from '../../../../mocks/data';

const modelsMock = { Messages: { findOneById: sinon.stub() } };
const getMentionsMock = sinon.stub();
const replyMock = sinon.stub();
const callbacksRunAsyncMock = sinon.stub();

const { processThreads } = p.noCallThru().load('../../../../../server/hooks/messages/processThreads.ts', {
	'@rocket.chat/models': modelsMock,
	'meteor/meteor': { Meteor: { startup: sinon.stub() } },
	'./notifyUsersOnMessage': { updateThreadUsersSubscriptions: sinon.stub(), getMentions: getMentionsMock },
	'./sendNotificationsOnMessage': { sendMessageNotifications: sinon.stub() },
	'../../lib/callbacks': {
		callbacks: { runAsync: callbacksRunAsyncMock, add: sinon.stub(), remove: sinon.stub(), priority: { LOW: 'low' } },
	},
	'../../lib/messaging/threads/functions': { reply: replyMock },
	'../../lib/notifyListener': { notifyOnMessageChange: sinon.stub() },
	'../../settings': { settings: { watch: sinon.stub() } },
});

describe('processThreads', () => {
	const room = createFakeRoom();
	const parentMessage = createFakeMessage({ rid: room._id, tcount: 1, replies: [] });
	const author = { _id: 'authorId', username: 'author' };

	const threadReply = (overrides: Record<string, unknown> = {}) =>
		createFakeMessage({ rid: room._id, tmid: parentMessage._id, u: author, ...overrides });

	beforeEach(() => {
		callbacksRunAsyncMock.reset();
		replyMock.reset();
		modelsMock.Messages.findOneById.reset();
		modelsMock.Messages.findOneById.resolves(parentMessage);
		getMentionsMock.reset();
		getMentionsMock.resolves({ mentionIds: [] });
	});

	it('should mark the thread as read for the author of the reply', async () => {
		await processThreads(threadReply(), room);

		expect(callbacksRunAsyncMock.calledWith('afterReadMessages', room, { uid: author._id, tmid: parentMessage._id })).to.be.true;
	});

	it('should mark the thread as read only after the thread metadata is updated', async () => {
		await processThreads(threadReply(), room);

		expect(replyMock.calledBefore(callbacksRunAsyncMock)).to.be.true;
	});

	it('should not mark anything as read when the message is not a thread reply', async () => {
		await processThreads(createFakeMessage({ rid: room._id, u: author }), room);

		expect(callbacksRunAsyncMock.called).to.be.false;
	});

	it('should not mark anything as read when the message was edited', async () => {
		await processThreads(threadReply({ editedAt: new Date(), editedBy: author }), room);

		expect(callbacksRunAsyncMock.called).to.be.false;
	});
});
