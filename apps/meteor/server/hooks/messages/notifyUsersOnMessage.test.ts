import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

import { createFakeMessage, createFakeRoom } from '../../../tests/mocks/data';

const cursor = <T>(docs: T[]) => ({ toArray: sinon.stub().resolves(docs) });

const modelsMock = {
	Subscriptions: {
		findByRoomWithUserHighlights: sinon.stub(),
		findByRoomIdAndNotAlertOrOpenExcludingUserIds: sinon.stub(),
		findByRoomIdAndUserIds: sinon.stub(),
		incUnreadForRoomIdExcludingUserIds: sinon.stub(),
		incGroupMentionsAndUnreadForRoomIdExcludingUserId: sinon.stub(),
		incUserMentionsAndUnreadForRoomIdAndUserIds: sinon.stub(),
		setAlertForRoomIdExcludingUserId: sinon.stub(),
		setOpenForRoomIdExcludingUserId: sinon.stub(),
		setAsReadByRoomIdAndUserId: sinon.stub(),
	},
	Rooms: { setIncMsgCountAndSetLastMessageUpdateQuery: sinon.stub(), getIncMsgCountUpdateQuery: sinon.stub() },
	Users: { findConnectedByRoomId: sinon.stub() },
};
const notifyOnSubscriptionChangedMock = sinon.stub();
const settingsGetMock = sinon.stub();

const { notifyUsersOnMessage } = p.noCallThru().load('./notifyUsersOnMessage.ts', {
	'@rocket.chat/models': modelsMock,
	'../../lib/callbacks': { callbacks: { run: sinon.stub().resolves([]), add: sinon.stub(), priority: { MEDIUM: 'medium' } } },
	'../../lib/notifications/message/messageContainsHighlight': { messageContainsHighlight: sinon.stub().returns(false) },
	'../../lib/notifyListener': {
		notifyOnSubscriptionChanged: notifyOnSubscriptionChangedMock,
		notifyOnSubscriptionChangedByRoomIdAndUserId: sinon.stub(),
		notifyOnSubscriptionChangedByRoomIdAndUserIds: sinon.stub(),
	},
	'../../settings': { settings: { get: settingsGetMock } },
});

describe('notifyUsersOnMessage', () => {
	const room = createFakeRoom({ t: 'c' });
	const sender = { _id: 'senderId', username: 'sender' };
	const member = { _id: 'memberId', username: 'member' };
	const offlineMember = { _id: 'offlineMemberId', username: 'offline' };
	const memberSubscription = { _id: 'memberSubId', rid: room._id, u: member, unread: 2, userMentions: 0, groupMentions: 0 };
	const offlineMemberSubscription = { _id: 'offlineSubId', rid: room._id, u: offlineMember, unread: 0, userMentions: 0, groupMentions: 0 };

	const send = (overrides: Record<string, unknown> = {}) =>
		notifyUsersOnMessage(createFakeMessage({ rid: room._id, u: sender, ts: new Date(), ...overrides }), room, {});

	beforeEach(() => {
		Object.values(modelsMock).forEach((model) => Object.values(model).forEach((stub) => stub.reset()));
		notifyOnSubscriptionChangedMock.reset();
		settingsGetMock.reset();

		modelsMock.Subscriptions.findByRoomWithUserHighlights.returns(cursor([]));
		modelsMock.Subscriptions.findByRoomIdAndNotAlertOrOpenExcludingUserIds.returns(cursor([memberSubscription, offlineMemberSubscription]));
		modelsMock.Subscriptions.findByRoomIdAndUserIds.returns(cursor([memberSubscription]));
		modelsMock.Subscriptions.setAsReadByRoomIdAndUserId.resolves({ modifiedCount: 0 });
		modelsMock.Users.findConnectedByRoomId.returns(cursor([sender, member]));
		settingsGetMock.withArgs('Unread_Count').returns('all_messages');
	});

	it('should notify only the connected members when every member counts the message as unread', async () => {
		await send();

		expect(modelsMock.Subscriptions.findByRoomIdAndUserIds.calledOnceWith(room._id, [member._id])).to.be.true;
		expect(notifyOnSubscriptionChangedMock.calledOnce).to.be.true;
		expect(notifyOnSubscriptionChangedMock.firstCall.args[0]).to.include({
			_id: memberSubscription._id,
			unread: 3,
			alert: true,
			open: true,
		});
	});

	it('should still count the message as unread for members who are not connected', async () => {
		await send();

		expect(modelsMock.Subscriptions.incUnreadForRoomIdExcludingUserIds.calledOnceWith(room._id, [sender._id], 1)).to.be.true;
	});

	it('should notify only the connected members on a mention to all', async () => {
		settingsGetMock.withArgs('Unread_Count').returns('user_and_group_mentions_only');

		await send({ mentions: [{ _id: 'all', username: 'all' }] });

		expect(modelsMock.Subscriptions.incGroupMentionsAndUnreadForRoomIdExcludingUserId.calledOnceWith(room._id, sender._id, 1, 1)).to.be
			.true;
		expect(notifyOnSubscriptionChangedMock.calledOnce).to.be.true;
		expect(notifyOnSubscriptionChangedMock.firstCall.args[0]).to.include({ _id: memberSubscription._id, groupMentions: 1 });
	});

	it('should not load any subscription when no other member is connected', async () => {
		modelsMock.Users.findConnectedByRoomId.returns(cursor([sender]));

		await send();

		expect(modelsMock.Subscriptions.findByRoomIdAndUserIds.called).to.be.false;
		expect(notifyOnSubscriptionChangedMock.called).to.be.false;
	});

	for (const t of ['d', 'l'] as const) {
		it(`should notify every member of a room of type ${t}, connected or not`, async () => {
			const directOrOmnichannelRoom = createFakeRoom({ t });
			settingsGetMock.withArgs(t === 'd' ? 'Unread_Count_DM' : 'Unread_Count_Omni').returns('all_messages');

			await notifyUsersOnMessage(
				createFakeMessage({ rid: directOrOmnichannelRoom._id, u: sender, ts: new Date() }),
				directOrOmnichannelRoom,
				{},
			);

			expect(modelsMock.Users.findConnectedByRoomId.called).to.be.false;
			expect(notifyOnSubscriptionChangedMock.calledTwice).to.be.true;
		});
	}

	it('should notify the members whose alert or open state changes when the message is not unread for everyone', async () => {
		settingsGetMock.withArgs('Unread_Count').returns('user_and_group_mentions_only');

		await send();

		expect(modelsMock.Users.findConnectedByRoomId.called).to.be.false;
		expect(
			modelsMock.Subscriptions.findByRoomIdAndNotAlertOrOpenExcludingUserIds.calledOnceWith({
				roomId: room._id,
				uidsExclude: [sender._id],
				uidsInclude: [],
				onlyRead: true,
			}),
		).to.be.true;
		expect(notifyOnSubscriptionChangedMock.calledTwice).to.be.true;
	});
});
