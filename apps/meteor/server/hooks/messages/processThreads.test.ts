import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

import { createFakeMessage, createFakeRoom } from '../../../tests/mocks/data';

const modelsMock = { Messages: { findOneById: sinon.stub() } };
const getMentionsMock = sinon.stub();
const replyMock = sinon.stub();
const callbacksRunAsyncMock = sinon.stub();

let processThreads: typeof import('./processThreads').processThreads;

before(async () => {
	const moduleMocks = [
		mock.module('./notifyUsersOnMessage', { exports: { updateThreadUsersSubscriptions: sinon.stub(), getMentions: getMentionsMock } }),
		mock.module('./sendNotificationsOnMessage', { exports: { sendMessageNotifications: sinon.stub() } }),
		mock.module('../../lib/callbacks', {
			exports: {
				callbacks: { runAsync: callbacksRunAsyncMock, add: sinon.stub(), remove: sinon.stub(), priority: { LOW: 'low' } },
			},
		}),
		mock.module('../../lib/messaging/threads/functions', { exports: { reply: replyMock } }),
		mock.module('../../lib/notifyListener', { exports: { notifyOnMessageChange: sinon.stub() } }),
		mock.module('../../settings', { exports: { settings: { watch: sinon.stub() } } }),
	];
	({ processThreads } = await import('./processThreads'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

describe('processThreads', () => {
	const room = createFakeRoom();
	const parentMessage = createFakeMessage({ rid: room._id, tcount: 1, replies: [] });
	const author = { _id: 'authorId', username: 'author' };

	const threadReply = (overrides: Record<string, unknown> = {}) =>
		createFakeMessage({ rid: room._id, tmid: parentMessage._id, u: author, ...overrides });

	before(() => {
		mockModel('Messages', modelsMock.Messages);
	});

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
