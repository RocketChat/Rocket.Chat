import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	Messages: {
		updateRepliesByThreadId: sinon.stub(),
		getThreadFollowsByThreadId: sinon.stub(),
	},
	Subscriptions: {
		addUnreadThreadByRoomIdAndUserIds: sinon.stub(),
		addUnreadGroupMentionThreadByRoomIdExcludingUserIds: sinon.stub(),
		setAlertForRoomIdAndUserIds: sinon.stub(),
		setOpenForRoomIdAndUserIds: sinon.stub(),
	},
	NotificationQueue: {},
};
const getMentionsMock = sinon.stub();
const getUserIdsFromHighlightsMock = sinon.stub();
const notifyByRoomIdMock = sinon.stub();
const notifyByRoomIdAndUserIdsMock = sinon.stub();

const { reply } = p.noCallThru().load('./functions.ts', {
	'@rocket.chat/core-typings': { isEditedMessage: () => false },
	'@rocket.chat/models': modelsMock,
	'../../../hooks/messages/notifyUsersOnMessage': {
		getMentions: getMentionsMock,
		getUserIdsFromHighlights: getUserIdsFromHighlightsMock,
	},
	'../../callbacks': { callbacks: { runAsync: sinon.stub() } },
	'../../notifyListener': {
		notifyOnSubscriptionChangedByRoomId: notifyByRoomIdMock,
		notifyOnSubscriptionChangedByRoomIdAndUserIds: notifyByRoomIdAndUserIdsMock,
		notifyOnSubscriptionChangedByRoomIdAndUserId: sinon.stub(),
	},
});

describe('threads reply()', () => {
	const sender = { _id: 'sender', username: 'sender' };
	const parentMessage = { _id: 'tmid', rid: 'rid', u: { _id: 'author' }, replies: [] } as any;
	const message = { _id: 'msg', rid: 'rid', tmid: 'tmid', ts: new Date(), u: sender } as any;

	beforeEach(() => {
		sinon.resetHistory();
		Object.values(modelsMock.Messages).forEach((stub) => stub.reset());
		Object.values(modelsMock.Subscriptions).forEach((stub) => stub.reset());
		getMentionsMock.reset();
		getUserIdsFromHighlightsMock.reset();
		notifyByRoomIdMock.reset();
		notifyByRoomIdAndUserIdsMock.reset();

		getUserIdsFromHighlightsMock.resolves([]);
		modelsMock.Messages.getThreadFollowsByThreadId.resolves(['follower', 'sender', 'mentioned']);
		modelsMock.Subscriptions.addUnreadThreadByRoomIdAndUserIds.resolves();
		modelsMock.Subscriptions.addUnreadGroupMentionThreadByRoomIdExcludingUserIds.resolves();
	});

	for (const [name, mentions] of [
		['@all', { toAll: true, toHere: false, mentionIds: ['mentioned'] }],
		['@here', { toAll: false, toHere: true, mentionIds: ['mentioned'] }],
	] as const) {
		it(`should set the unread thread state for the rest of the room on ${name}`, async () => {
			getMentionsMock.resolves(mentions);

			await reply({ tmid: 'tmid' }, message, parentMessage, ['follower']);

			const call = modelsMock.Subscriptions.addUnreadGroupMentionThreadByRoomIdExcludingUserIds;
			expect(call.calledOnce).to.be.true;
			const [rid, excluded, tmid] = call.firstCall.args;
			expect(rid).to.equal('rid');
			expect(tmid).to.equal('tmid');
			// sender, followers (handled separately) and mentioned users (get tunreadUser) are excluded
			expect(excluded).to.have.members(['sender', 'follower', 'mentioned']);
		});

		it(`should keep flagging thread followers as group mention on ${name}`, async () => {
			getMentionsMock.resolves(mentions);

			await reply({ tmid: 'tmid' }, message, parentMessage, ['follower']);

			expect(
				modelsMock.Subscriptions.addUnreadThreadByRoomIdAndUserIds.calledWith('rid', ['follower'], 'tmid', { groupMention: true }),
			).to.be.true;
		});

		it(`should notify every subscription of the room on ${name}`, async () => {
			getMentionsMock.resolves(mentions);

			await reply({ tmid: 'tmid' }, message, parentMessage, ['follower']);

			expect(notifyByRoomIdMock.calledOnceWith('rid')).to.be.true;
			expect(notifyByRoomIdAndUserIdsMock.called).to.be.false;
		});
	}

	it('should not touch the rest of the room when there is no group mention', async () => {
		getMentionsMock.resolves({ toAll: false, toHere: false, mentionIds: ['mentioned'] });

		await reply({ tmid: 'tmid' }, message, parentMessage, ['follower']);

		expect(modelsMock.Subscriptions.addUnreadGroupMentionThreadByRoomIdExcludingUserIds.called).to.be.false;
		expect(notifyByRoomIdMock.called).to.be.false;
		expect(notifyByRoomIdAndUserIdsMock.calledOnce).to.be.true;
	});
});
