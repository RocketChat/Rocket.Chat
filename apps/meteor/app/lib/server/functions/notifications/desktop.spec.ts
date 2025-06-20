import type { IRoom } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const broadcastStub = sinon.stub();
const settingsGetStub = sinon.stub();

const { buildNotificationDetails } = proxyquire.noCallThru().load('../../../../../server/lib/rooms/buildNotificationDetails.ts', {
	'../../../app/settings/server': { settings: { get: settingsGetStub } },
});
const { roomCoordinator } = proxyquire.noCallThru().load('../../../../../server/lib/rooms/roomCoordinator.ts', {
	'../../../app/settings/server': { settings: { get: settingsGetStub } },
	'./buildNotificationDetails': { buildNotificationDetails },
});

['public', 'private', 'voip', 'livechat'].forEach((type) => {
	proxyquire.noCallThru().load(`../../../../../server/lib/rooms/roomTypes/${type}.ts`, {
		'../../../../app/settings/server': { settings: { get: settingsGetStub } },
		'../roomCoordinator': { roomCoordinator },
		'../buildNotificationDetails': { buildNotificationDetails },
	});
});

proxyquire.noCallThru().load('../../../../../server/lib/rooms/roomTypes/direct.ts', {
	'../../../../app/settings/server': { settings: { get: settingsGetStub } },
	'../roomCoordinator': { roomCoordinator },
	'../buildNotificationDetails': { buildNotificationDetails },
	'meteor/meteor': { Meteor: { userId: () => 'user123' } },
	'@rocket.chat/models': {
		Subscription: {
			findOneByRoomIdAndUserId: () => ({ name: 'general', fname: 'general' }),
		},
	},
});

const { notifyDesktopUser } = proxyquire.noCallThru().load('./desktop', {
	'../../../../settings/server': { settings: { get: settingsGetStub } },
	'../../../../metrics/server': {
		metrics: {
			notificationsSent: { inc: sinon.stub() },
		},
	},
	'@rocket.chat/core-services': { api: { broadcast: broadcastStub } },
	'../../lib/sendNotificationsOnMessage': {},
	'../../../../../server/lib/rooms/roomCoordinator': { roomCoordinator },
});

const fakeUserId = 'user123';

const createTestData = (t: IRoom['t'] = 'c', showPushMessage = false, showUserOrRoomName = false, groupDM = false) => {
	const sender = { _id: 'sender123', name: 'Alice', username: 'alice' };
	let uids: string[] | undefined;
	if (t === 'd') {
		uids = groupDM ? ['sender123', 'user123', 'otherUser123'] : ['sender123', 'user123'];
	}

	const room: Partial<IRoom> = {
		t,
		_id: 'room123',
		msgs: 0,
		_updatedAt: new Date(),
		u: sender,
		usersCount: uids ? uids.length : 2,
		fname: uids?.length === 2 ? sender.name : 'general',
		name: uids?.length === 2 ? sender.username : 'general',
		uids,
	};

	const message = {
		_id: 'msg123',
		rid: 'room123',
		tmid: null,
		u: sender,
		msg: 'Fake message here',
	};

	const receiver = {
		_id: 'user123',
		language: 'en',
		username: 'receiver-username',
		emails: [{ address: 'receiver@example.com', verified: true }],
		active: true,
		status: UserStatus.OFFLINE,
		statusConnection: 'offline',
	};

	let expectedTitle: string | undefined;
	if (showUserOrRoomName) {
		switch (t) {
			case 'c':
			case 'p':
				expectedTitle = `#${room.name}`;
				break;
			case 'l':
			case 'v':
				expectedTitle = `[Omnichannel] ${room.name}`;
				break;
			case 'd':
				expectedTitle = room.name;
				break;
		}
	}

	let expectedNotificationMessage: string;

	if (!showPushMessage) {
		expectedNotificationMessage = 'You have a new message';
	} else if (!showUserOrRoomName) {
		// No prefix if showUserOrRoomName is false
		expectedNotificationMessage = message.msg;
	} else if (t === 'd' && uids && uids.length > 2) {
		expectedNotificationMessage = `${sender.username}: ${message.msg}`;
	} else {
		switch (t) {
			case 'c':
			case 'p':
				expectedNotificationMessage = `${sender.username}: ${message.msg}`;
				break;
			case 'l':
			case 'v':
			case 'd':
				expectedNotificationMessage = message.msg;
				break;
		}
	}

	return {
		room: room as IRoom,
		user: sender,
		message,
		receiver,
		expectedTitle,
		expectedNotificationMessage,
	};
};

describe('notifyDesktopUser privacy settings across all room types', () => {
	const roomTypes: Array<{ t: IRoom['t']; isGroupDM?: boolean }> = [
		{ t: 'c' },
		{ t: 'p' },
		{ t: 'l' },
		{ t: 'v' },
		{ t: 'd', isGroupDM: false },
		{ t: 'd', isGroupDM: true },
	];

	afterEach(() => {
		broadcastStub.resetHistory();
		settingsGetStub.resetHistory();
	});

	roomTypes.forEach(({ t, isGroupDM = false }) => {
		let roomLabel: string;
		if (t === 'c') {
			roomLabel = 'channel';
		} else if (t === 'p') {
			roomLabel = 'private';
		} else if (t === 'l') {
			roomLabel = 'livechat';
		} else if (t === 'v') {
			roomLabel = 'voip';
		} else if (t === 'd' && isGroupDM) {
			roomLabel = 'direct (group DM)';
		} else {
			roomLabel = 'direct (1:1 DM)';
		}

		describe(`when room type is "${roomLabel}"`, () => {
			[
				{ showPushMessage: false, showUserOrRoomName: true },
				{ showPushMessage: true, showUserOrRoomName: false },
				{ showPushMessage: false, showUserOrRoomName: false },
				{ showPushMessage: true, showUserOrRoomName: true },
			].forEach(({ showPushMessage, showUserOrRoomName }) => {
				const label = `Push_show_message=${
					showPushMessage ? 'true' : 'false'
				} and Push_show_username_room=${showUserOrRoomName ? 'true' : 'false'}`;

				it(`should handle settings: ${label}`, async () => {
					const { room, user, message, receiver, expectedTitle, expectedNotificationMessage } = createTestData(
						t,
						showPushMessage,
						showUserOrRoomName,
						isGroupDM,
					);

					settingsGetStub.withArgs('Push_show_message').returns(showPushMessage);
					settingsGetStub.withArgs('Push_show_username_room').returns(showUserOrRoomName);
					settingsGetStub.withArgs('UI_Use_Real_Name').returns(false);

					const duration = 4000;
					const notificationMessage = message.msg;

					await notifyDesktopUser({
						userId: fakeUserId,
						user,
						room,
						message,
						duration,
						notificationMessage,
						receiver,
					});

					expect(broadcastStub.calledOnce).to.be.true;
					const [eventName, targetUserId, payload] = broadcastStub.firstCall.args as [string, string, any];

					expect(eventName).to.equal('notify.desktop');
					expect(targetUserId).to.equal(fakeUserId);

					expect(payload.text).to.equal(expectedNotificationMessage);

					if (showPushMessage) {
						expect(payload.payload.message?.msg).to.equal(message.msg);
					} else {
						expect(!!payload.payload.message?.msg).to.equal(false);
					}

					if (showUserOrRoomName) {
						expect(payload.title).to.equal(expectedTitle);
						expect(payload.payload.name).to.equal(room.name);
					} else {
						expect(!!payload.title).to.equal(false, `Found title to be ${payload.title} when expected falsy`);
						expect(!!payload.payload.name).to.equal(false, `Found name to be ${payload.name} when expected falsy`);
					}
				});
			});
		});
	});
});
